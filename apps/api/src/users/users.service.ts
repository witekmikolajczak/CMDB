// apps/api/src/users/users.service.ts
import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { hashSync } from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { CsvUploadResultDto, CreatedUserDto, FailedUserDto } from './dto/csv-upload-result.dto';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { stringify } from 'csv-stringify/sync';

// Define user profile update DTO
export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private data: Buffer | null = null;
  private contentType: string | null = null;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get the total count of users
   */
  async getUsersCount() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query users count
      const result = await client?.query(
        'SELECT COUNT(*) as count FROM cmdb.users'
      );
      
      return { count: parseInt(result?.rows[0].count) || 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch users count: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get the count of users created this week
   */
  async getUsersCountThisWeek() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query users count for this week
      const result = await client?.query(
        "SELECT COUNT(*) as countWeek FROM cmdb.users WHERE created_at >= NOW() - INTERVAL '1 week'"
      );
      
      // Return the count
      
      return { count: parseInt(result?.rows[0].countweek) || 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch users count for this week: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if roles and statuses tables exist
      const rolesTableExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'cmdb' AND table_name = 'roles'
        );
      `);
      
      const statusesTableExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'cmdb' AND table_name = 'user_statuses'
        );
      `);
      
      // Check if role_id and status_id columns exist in users table
      const roleIdColumnExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'cmdb' AND table_name = 'users' AND column_name = 'role_id'
        );
      `);
      
      const statusIdColumnExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'cmdb' AND table_name = 'users' AND column_name = 'status_id'
        );
      `);
      
      let query = '';
      
      // Build query based on schema
      if (rolesTableExists?.rows[0].exists && 
          statusesTableExists?.rows[0].exists && 
          roleIdColumnExists?.rows[0].exists && 
          statusIdColumnExists?.rows[0].exists) {
        // New schema with roles and statuses tables
        query = `
          SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                 r.name as role, 
                 s.name as status, 
                 d.name as department_name, d.id as department_id
          FROM cmdb.users u
          LEFT JOIN cmdb.roles r ON u.role_id = r.id
          LEFT JOIN cmdb.user_statuses s ON u.status_id = s.id
          LEFT JOIN cmdb.departments d ON u.department_id = d.id
          ORDER BY u.first_name, u.last_name
        `;
      } else {
        // Old schema with role and status columns
        query = `
          SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, 
                 u.status, d.name as department_name, d.id as department_id
          FROM cmdb.users u
          LEFT JOIN cmdb.departments d ON u.department_id = d.id
          ORDER BY u.first_name, u.last_name
        `;
      }
      
      // Execute query
      const result = await client?.query(query);
      
      // Map the database result to user objects
      return result?.rows.map(row => {
        // Determine role and status based on schema
        const role = row.role || 'standard_user';
        const status = row.status || 'active';
        
        return {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: role,
          roleId: row.role_id || null,
          status: status,
          statusId: row.status_id || null,
          department: row.department_name || 'Unassigned',
          departmentId: row.department_id || null
        };
      }) || [];
    } catch (error) {
      this.logger.error(`Failed to fetch all users: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
  
  /**
   * Get users by department for a specific user (manager or standard user)
   * @param userId The ID of the user requesting the data
   */
  async getUsersByDepartment(userId: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // First, find the departments this user belongs to
      const userDepartmentsResult = await client?.query(`
        SELECT department_id 
        FROM cmdb.department_users 
        WHERE user_id = $1
      `, [userId]);
      
      const departmentIds = userDepartmentsResult?.rows.map(row => row.department_id);
      
      if (!departmentIds || departmentIds.length === 0) {
        return []; // User doesn't belong to any department
      }
      
      // Check if roles and statuses tables exist
      const rolesTableExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'cmdb' AND table_name = 'roles'
        );
      `);
      
      const statusesTableExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'cmdb' AND table_name = 'user_statuses'
        );
      `);
      
      // Check if role_id and status_id columns exist in users table
      const roleIdColumnExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'cmdb' AND table_name = 'users' AND column_name = 'role_id'
        );
      `);
      
      const statusIdColumnExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'cmdb' AND table_name = 'users' AND column_name = 'status_id'
        );
      `);
      
      let query = '';
      
      // Build query based on schema
      if (rolesTableExists?.rows[0].exists && 
          statusesTableExists?.rows[0].exists && 
          roleIdColumnExists?.rows[0].exists && 
          statusIdColumnExists?.rows[0].exists) {
        // New schema with roles and statuses tables
        query = `
          SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                 r.name as role, 
                 s.name as status, 
                 d.name as department_name, d.id as department_id
          FROM cmdb.users u
          LEFT JOIN cmdb.roles r ON u.role_id = r.id
          LEFT JOIN cmdb.user_statuses s ON u.status_id = s.id
          LEFT JOIN cmdb.departments d ON u.department_id = d.id
          JOIN cmdb.department_users du ON u.id = du.user_id
          WHERE du.department_id = ANY($1::uuid[])
          ORDER BY u.first_name, u.last_name
        `;
      } else {
        // Old schema with role and status columns
        query = `
          SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, 
                 u.status, d.name as department_name, d.id as department_id
          FROM cmdb.users u
          LEFT JOIN cmdb.departments d ON u.department_id = d.id
          JOIN cmdb.department_users du ON u.id = du.user_id
          WHERE du.department_id = ANY($1::uuid[])
          ORDER BY u.first_name, u.last_name
        `;
      }
      
      // Execute query
      const result = await client?.query(query, [departmentIds]);
      
      // Map the database result to user objects
      return result?.rows.map(row => {
        // Determine role and status based on schema
        const role = row.role || 'standard_user';
        const status = row.status || 'active';
        
        return {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: role,
          roleId: row.role_id || null,
          status: status,
          statusId: row.status_id || null,
          department: row.department_name || 'Unassigned',
          departmentId: row.department_id || null
        };
      }) || [];
    } catch (error) {
      this.logger.error(`Failed to fetch users by department: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(userId: string, profileData: UpdateUserProfileDto) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Update user profile
      const result = await client?.query(
        `UPDATE cmdb.users 
         SET first_name = $1, 
             last_name = $2, 
             email = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, username, email, first_name, last_name, role_id, department_id`
        ,
        [
          profileData.firstName,
          profileData.lastName,
          profileData.email,
          userId
        ]
      );
      
      // Map the database result to a user object
      const updatedUser = result?.rows[0];
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Get role name
      const roleResult = await client?.query(
        'SELECT name FROM cmdb.roles WHERE id = $1',
        [updatedUser.role_id]
      );
      
      return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: roleResult?.rows?.[0]?.name || 'Standard User',
        departmentId: updatedUser.department_id
      };
    } catch (error) {
      this.logger.error(`Failed to update user profile: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Update a user by ID (admin only)
   */
  async updateUser(userId: string, userData: any) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Log the raw userData to see what's coming from the frontend
      this.logger.log(`Raw userData: ${JSON.stringify(userData)}`);
      
      // Check if user exists
      const userResult = await client?.query(
        'SELECT id FROM cmdb.users WHERE id = $1',
        [userId]
      );
      
      if (!userResult?.rows?.[0]) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Map camelCase property names to snake_case column names
      const columnMapping: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
        departmentId: 'department_id',
        department: 'department_id',
        employeeId: 'employee_id',
        positionTitle: 'position_title',
        managerId: 'manager_id',
        locationId: 'location_id',
        roomNumber: 'room_number',
        hireDate: 'hire_date'
      };
      
      // Add role and status mappings based on schema
      columnMapping.roleId = 'role_id';
      columnMapping.statusId = 'status_id';
      
      // Create a new object with the correct column names
      const mappedUserData: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(userData)) {
        // Skip undefined values
        if (value === undefined) continue;
        
        // Skip role and status columns
        if (key === 'role' || key === 'status') {
          continue;
        }
        
        // Use the mapped column name if available, otherwise use the original key
        const columnName = columnMapping[key] || key;
        
        // Ensure department_id is an integer if it's not null
        if (columnName === 'department_id' && value !== null) {
          try {
            mappedUserData[columnName] = typeof value === 'string' ? parseInt(value, 10) : value;
          } catch (error) {
            this.logger.error(`Error converting department_id to integer: ${error.message}`);
            // If conversion fails, don't include the field in the update
            continue;
          }
        } 
        // Ensure role_id and status_id are integers if they're not null
        else if ((columnName === 'role_id' || columnName === 'status_id') && value !== null) {
          try {
            mappedUserData[columnName] = typeof value === 'string' ? parseInt(value, 10) : value;
          } catch (error) {
            this.logger.error(`Error converting ${columnName} to integer: ${error.message}`);
            // If conversion fails, don't include the field in the update
            continue;
          }
        } else {
          mappedUserData[columnName] = value;
        }
      }
      
      // Log the mapped data
      this.logger.log(`Mapped userData: ${JSON.stringify(mappedUserData)}`);
      
      // Update user
      const updateFields = Object.keys(mappedUserData)
        .map((key, index) => {
          // Handle null values for role_id and status_id
          if (key === 'role_id' || key === 'status_id') {
            return `${key} = COALESCE($${index + 1}, ${key})`;
          }
          return `${key} = $${index + 1}`;
        })
        .join(', ');
      
      const values = Object.values(mappedUserData);
      values.push(userId);
      
      this.logger.log(`Updating user with ID ${userId} with fields: ${updateFields}`);
      this.logger.log(`Values: ${JSON.stringify(values)}`);
      
      const returningFields = 'id, username, email, first_name, last_name, role_id, status_id, department_id';
      
      const query = `
        UPDATE cmdb.users 
        SET ${updateFields}, 
            updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING ${returningFields}
      `;
      
      const result = await client?.query(query, values);
      
      const updatedUser = result?.rows?.[0];
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Get role name
      const roleResult = await client?.query(
        'SELECT name FROM cmdb.roles WHERE id = $1',
        [updatedUser.role_id]
      );
      
      // Get status name
      const statusResult = await client?.query(
        'SELECT name FROM cmdb.user_statuses WHERE id = $1',
        [updatedUser.status_id]
      );
      
      return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        roleId: updatedUser.role_id,
        statusId: updatedUser.status_id,
        departmentId: updatedUser.department_id,
        department: 'Unassigned',
        role: roleResult?.rows?.[0]?.name || 'Standard User',
        status: statusResult?.rows?.[0]?.name || 'Active'
      };
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Upload a profile picture for a user
   * @param userId The ID of the user
   * @param file The uploaded file
   * @returns The updated user object
   */
  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if user exists
      const userResult = await client?.query(
        'SELECT id FROM cmdb.users WHERE id = $1',
        [userId]
      );
      
      if (!userResult?.rows?.[0]) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Update user with profile picture
      await client?.query(
        'UPDATE cmdb.users SET profile_picture = $1, profile_picture_type = $2, updated_at = NOW() WHERE id = $3',
        [file.buffer, file.mimetype, userId]
      );
      
      return {
        success: true,
        message: 'Profile picture uploaded successfully',
        user: {
          id: userId,
          profilePicture: file.originalname
        }
      };
    } catch (error) {
      this.logger.error('Error uploading profile picture:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Delete a user's profile picture
   * @param userId The ID of the user
   * @returns Success message
   */
  async deleteProfilePicture(userId: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if user exists
      const userResult = await client?.query(
        'SELECT id FROM cmdb.users WHERE id = $1',
        [userId]
      );
      
      if (!userResult?.rows?.[0]) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Update user to remove profile picture
      await client?.query(
        'UPDATE cmdb.users SET profile_picture = NULL, profile_picture_type = NULL, updated_at = NOW() WHERE id = $1',
        [userId]
      );

      return {
        success: true,
        message: 'Profile picture deleted successfully'
      };
    } catch (error) {
      this.logger.error('Error deleting profile picture:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get user profile picture
   */
  async getProfilePicture(userId: string): Promise<{ data: Buffer; contentType: string } | null> {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Get user's profile picture
      const result = await client?.query(
        'SELECT profile_picture, profile_picture_type FROM cmdb.users WHERE id = $1',
        [userId]
      );
      
      const user = result?.rows?.[0];
      if (!user || !user.profile_picture) {
        return null;
      }
      
      return { 
        data: user.profile_picture as Buffer, 
        contentType: user.profile_picture_type || 'image/jpeg' 
      };
    } catch (error) {
      this.logger.error(`Error getting profile picture: ${error.message}`, error);
      return null;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get all available user roles
   */
  async getUserRoles() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if roles table exists
      const rolesTableExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'cmdb' AND table_name = 'roles'
        );
      `);
      
      if (rolesTableExists?.rows[0].exists) {
        // Query available roles from the roles table
        const result = await client?.query(
          'SELECT id, name, description FROM cmdb.roles ORDER BY name'
        );
        
        return result?.rows || [];
      } else {
        // Fallback to the old method if roles table doesn't exist
        const result = await client?.query(
          'SELECT DISTINCT role FROM cmdb.users ORDER BY role'
        );
        
        return result?.rows.map(row => ({ 
          id: row.role, 
          name: row.role.replace('_', ' '),
          description: ''
        })) || [];
      }
    } catch (error) {
      this.logger.error(`Failed to fetch user roles: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get all available user statuses
   */
  async getUserStatuses() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if user_statuses table exists
      const statusesTableExists = await client?.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'cmdb' AND table_name = 'user_statuses'
        );
      `);
      
      if (statusesTableExists?.rows[0].exists) {
        // Query available statuses from the user_statuses table
        const result = await client?.query(
          'SELECT id, name, description FROM cmdb.user_statuses ORDER BY name'
        );
        
        return result?.rows || [];
      } else {
        // Fallback to hardcoded statuses if user_statuses table doesn't exist
        return [
          { id: 'active', name: 'active', description: 'User account is active' },
          { id: 'inactive', name: 'inactive', description: 'User account is disabled' }
        ];
      }
    } catch (error) {
      this.logger.error(`Failed to fetch user statuses: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Delete a user by ID (admin only)
   */
  async deleteUser(userId: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if user exists
      const userResult = await client?.query(
        'SELECT id FROM cmdb.users WHERE id = $1',
        [userId]
      );
      
      if (!userResult?.rows?.[0]) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Delete user
      await client?.query(
        'DELETE FROM cmdb.users WHERE id = $1',
        [userId]
      );
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
  
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserDto) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if the email already exists
      const emailCheckResult = await client?.query(
        'SELECT id FROM cmdb.users WHERE email = $1',
        [userData.email]
      );
      
      if (emailCheckResult?.rows?.length > 0) {
        throw new ConflictException('A user with this email already exists');
      }
      
      // Generate a username based on the email
      const username = userData.email.split('@')[0];
      
      // Generate a default password if none is provided
      const password = userData.password || 'changeme123';
      
      // Hash the password using bcrypt
      const passwordHash = hashSync(password, 10);
      
      // Generate a UUID for the new user
      const userId = uuidv4();
      
      // Insert new user into the database
      const result = await client?.query(
        `INSERT INTO cmdb.users (
          id, username, email, first_name, last_name, role_id, status_id, department_id, password_hash, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id, username, email, first_name, last_name, role_id, status_id, department_id`,
        [
          userId,
          username,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.roleId || 2,  // Default to standard user if not specified
          userData.statusId || 1, // Default to active status if not specified
          userData.departmentId || null,
          passwordHash
        ]
      );
      
      const newUser = result?.rows?.[0];
      if (!newUser) {
        throw new Error('Failed to create user');
      }
      
      // Get role name
      const roleResult = await client?.query(
        'SELECT name FROM cmdb.roles WHERE id = $1',
        [newUser.role_id]
      );
      
      // Get status name
      const statusResult = await client?.query(
        'SELECT name FROM cmdb.user_statuses WHERE id = $1',
        [newUser.status_id]
      );
      
      // Get department name
      const departmentResult = newUser.department_id ? await client?.query(
        'SELECT name FROM cmdb.departments WHERE id = $1',
        [newUser.department_id]
      ) : null;
      
      return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        roleId: newUser.role_id,
        statusId: newUser.status_id,
        departmentId: newUser.department_id,
        role: roleResult?.rows?.[0]?.name || 'Standard User',
        status: statusResult?.rows?.[0]?.name || 'Active',
        department: departmentResult?.rows?.[0]?.name || 'Unassigned',
        message: 'User created successfully'
      };
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Generate a CSV template for bulk user upload
   * @returns CSV template as a string
   */
  async generateCsvTemplate(): Promise<string> {
    try {
      // Define the CSV header and a sample row
      const header = ['firstName', 'lastName', 'email', 'roleId', 'statusId', 'departmentId'];
      const sampleRow = ['John', 'Doe', 'john.doe@example.com', '2', '1', ''];
      
      // Generate the CSV content
      const csvContent = stringify([header, sampleRow], { header: false });
      
      return csvContent;
    } catch (error) {
      this.logger.error(`Error generating CSV template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get departments that a user belongs to
   * @param userId The ID of the user
   * @returns Array of departments
   */
  async getUserDepartments(userId: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query departments that the user is associated with
      const result = await client?.query(`
        SELECT 
          d.id, 
          d.name, 
          d.description, 
          d.parent_id
        FROM 
          cmdb.departments d
        JOIN
          cmdb.department_users du ON d.id = du.department_id
        WHERE
          du.user_id = $1
        ORDER BY 
          d.name
      `, [userId]);
      
      return result?.rows || [];
    } catch (error) {
      this.logger.error(`Failed to fetch departments for user ${userId}: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Process a CSV file for bulk user upload
   * @param file The uploaded CSV file
   * @returns Result of the CSV processing
   */
  async processCsvBulkUpload(file: Express.Multer.File): Promise<CsvUploadResultDto> {
    let client: PoolClient | null = null;
    
    try {
      // Validate file
      if (!file || !file.buffer) {
        throw new BadRequestException('Invalid file');
      }
      
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Parse CSV file
      const users: BulkCreateUsersDto[] = [];
      const fileContent = file.buffer.toString('utf8');
      const stream = Readable.from(fileContent);
      
      // Process the CSV stream
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data: any) => {
            // Map CSV columns to DTO properties
            const user: BulkCreateUsersDto = {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              roleId: data.roleId ? parseInt(data.roleId, 10) : 2, // Default to standard user
              statusId: data.statusId ? parseInt(data.statusId, 10) : 1, // Default to active
              departmentId: data.departmentId || null
            };
            users.push(user);
          })
          .on('end', () => resolve())
          .on('error', (error) => reject(error));
      });
      
      // Process each user
      const result: CsvUploadResultDto = {
        success: true,
        message: 'CSV processed successfully',
        createdUsers: [],
        failedUsers: []
      };
      
      // Begin transaction
      await client.query('BEGIN');
      
      for (const userData of users) {
        try {
          // Validate required fields
          if (!userData.firstName || !userData.lastName || !userData.email) {
            result.failedUsers.push({
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              reason: 'Missing required fields'
            });
            continue;
          }
          
          // Check if email already exists
          const emailCheckResult = await client.query(
            'SELECT id FROM cmdb.users WHERE email = $1',
            [userData.email]
          );
          
          if (emailCheckResult.rows.length > 0) {
            result.failedUsers.push({
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              reason: 'Email already exists'
            });
            continue;
          }
          
          // Generate username from email
          const username = userData.email.split('@')[0];
          
          // Generate a random password
          const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          
          // Hash the password using bcrypt
          const passwordHash = hashSync(password, 10);
          
          // Generate UUID for the user
          const userId = uuidv4();
          
          // Insert user into database
          await client.query(
            `INSERT INTO cmdb.users (
              id, username, email, first_name, last_name, role_id, status_id, department_id, password_hash, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
            [
              userId,
              username,
              userData.email,
              userData.firstName,
              userData.lastName,
              userData.roleId || 2, // Default to standard user
              userData.statusId || 1, // Default to active
              userData.departmentId || null,
              passwordHash // Password is now properly hashed
            ]
          );
          
          // Add to created users list
          result.createdUsers.push({
            username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password
          });
        } catch (error) {
          this.logger.error(`Error creating user from CSV: ${error.message}`);
          result.failedUsers.push({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            reason: `Error: ${error.message}`
          });
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Update result message
      result.message = `Processed ${users.length} users. Created: ${result.createdUsers.length}, Failed: ${result.failedUsers.length}`;
      
      return result;
    } catch (error) {
      this.logger.error(`Error processing CSV upload: ${error.message}`);
      
      // Rollback transaction if client exists
      if (client) {
        await client.query('ROLLBACK');
      }
      
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Process a CSV file for bulk user upload by a manager
   * @param file The uploaded CSV file
   * @param managerId The ID of the manager uploading the file
   * @returns Result of the CSV processing
   */
  async processCsvBulkUploadForManager(file: Express.Multer.File, managerId: string): Promise<CsvUploadResultDto> {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // First, get the departments this manager belongs to
      const managerDepartments = await this.getUserDepartments(managerId);
      
      if (!managerDepartments || managerDepartments.length === 0) {
        throw new Error('Manager does not belong to any department');
      }
      
      const departmentIds = managerDepartments.map(dept => dept.id);
      
      // Parse the CSV file
      const csvContent = file.buffer.toString('utf-8');
      const rows = csvContent.split('\n');
      
      // Skip header row
      const headerRow = rows[0];
      const dataRows = rows.slice(1).filter(row => row.trim() !== '');
      
      // Validate header row
      const expectedHeaders = ['firstName', 'lastName', 'email', 'departmentId'];
      const headers = headerRow.split(',').map(h => h.trim());
      
      for (const expectedHeader of expectedHeaders) {
        if (!headers.includes(expectedHeader)) {
          throw new Error(`CSV file is missing required header: ${expectedHeader}`);
        }
      }
      
      // Process each row
      const createdUsers: CreatedUserDto[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const values = row.split(',').map(v => v.trim());
        
        try {
          // Create user object from CSV row
          const userData: any = {};
          headers.forEach((header, index) => {
            userData[header] = values[index];
          });
          
          // Validate required fields
          if (!userData.firstName || !userData.lastName || !userData.email) {
            throw new Error('Missing required fields');
          }
          
          // Check if department is one that the manager has access to
          if (userData.departmentId && !departmentIds.includes(userData.departmentId)) {
            throw new Error('Manager does not have access to the specified department');
          }
          
          // Generate random password
          const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          const passwordHash = hashSync(password, 10);
          
          // Generate UUID for new user
          const userId = crypto.randomUUID();
          
          // Check for duplicate email
          const emailExists = await client.query(
            'SELECT COUNT(*) FROM cmdb.users WHERE email = $1',
            [userData.email]
          );
          
          if (parseInt(emailExists.rows[0].count) > 0) {
            throw new Error(`Email already exists: ${userData.email}`);
          }
          
          // Get role ID for standard_user
          const roleResult = await client.query(
            'SELECT id FROM cmdb.roles WHERE name = $1',
            ['standard_user']
          );
          
          if (roleResult.rows.length === 0) {
            throw new Error('Standard user role not found');
          }
          
          const roleId = roleResult.rows[0].id;
          
          // Get status ID for active
          const statusResult = await client.query(
            'SELECT id FROM cmdb.statuses WHERE name = $1',
            ['active']
          );
          
          const statusId = statusResult.rows.length > 0 ? statusResult.rows[0].id : 1;
          
          // Insert user
          await client.query(
            `INSERT INTO cmdb.users (
              id, first_name, last_name, email, username, password_hash, role_id, status_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              userId,
              userData.firstName,
              userData.lastName,
              userData.email,
              userData.email.split('@')[0],
              passwordHash,
              roleId,
              statusId
            ]
          );
          
          // If department ID is provided, add user to department
          if (userData.departmentId) {
            await client.query(
              'INSERT INTO cmdb.department_users (department_id, user_id) VALUES ($1, $2)',
              [userData.departmentId, userId]
            );
          }
          
          // Add to created users list
          createdUsers.push({
            id: userId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            username: userData.email.split('@')[0],
            password: password
          });
          
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
      
      return {
        success: createdUsers.length > 0,
        message: `Processed ${dataRows.length} rows, created ${createdUsers.length} users, ${errors.length} errors`,
        createdUsers: createdUsers,
        failedUsers: [], // No detailed failed user info in this implementation
        totalRows: dataRows.length,
        errors: errors
      };
      
    } catch (error) {
      this.logger.error(`Failed to process CSV upload: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Generate a CSV with usernames and passwords for newly created users
   * @param users List of created users
   * @returns CSV data as a string
   */
  async generatePasswordsCsv(users: CreatedUserDto[]): Promise<string> {
    try {
      if (!users || users.length === 0) {
        return '';
      }
      
      // Define the CSV header
      const header = ['Username', 'First Name', 'Last Name', 'Email', 'Password'];
      
      // Prepare data rows
      const rows = users.map(user => [
        user.username,
        user.firstName,
        user.lastName,
        user.email,
        user.password
      ]);
      
      // Generate the CSV content
      const csvContent = stringify([header, ...rows], { header: false });
      
      return csvContent;
    } catch (error) {
      this.logger.error(`Error generating passwords CSV: ${error.message}`);
      throw error;
    }
  }
}
