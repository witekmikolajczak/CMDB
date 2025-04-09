// apps/api/src/users/users.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from '../database/database.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

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
      
      // Log the raw query result for debugging
      this.logger.log(`Raw query result: ${JSON.stringify(result?.rows[0])}`);
      
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
}
