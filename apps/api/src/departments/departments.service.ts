// apps/api/src/departments/departments.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private readonly databaseService: DatabaseService
  ) {}
  /**
   * Find all departments
   */
  async findAll() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query all departments with user and asset counts
      const result = await client?.query(`
        SELECT 
          d.id, 
          d.name, 
          d.description, 
          d.parent_id,
          COALESCE((SELECT COUNT(*) FROM cmdb.department_users WHERE department_id = d.id), 0) AS user_count,
          COALESCE((SELECT COUNT(*) FROM cmdb.assets WHERE department_id = d.id), 0) AS asset_count
        FROM 
          cmdb.departments d
        ORDER BY 
          d.name
      `);
      
      return result?.rows || [];
    } catch (error) {
      this.logger.error(`Failed to fetch departments: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
  
  /**
   * Find departments by user ID (for manager role)
   */
  async findByUserId(userId: string) {
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
          d.parent_id,
          COALESCE((SELECT COUNT(*) FROM cmdb.department_users WHERE department_id = d.id), 0) AS user_count,
          COALESCE((SELECT COUNT(*) FROM cmdb.assets WHERE department_id = d.id), 0) AS asset_count
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
   * Get the total count of departments
   */
  async getDepartmentsCount() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query departments count
      const result = await client?.query(
        'SELECT COUNT(*) as count FROM cmdb.departments'
      );
      
      return { count: parseInt(result?.rows[0].count) || 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch departments count: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Find department by ID
   */
  async findById(id: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query department by ID
      const result = await client?.query(
        'SELECT id, name, description, parent_id FROM cmdb.departments WHERE id = $1',
        [id]
      );
      
      return result?.rows[0] || null;
    } catch (error) {
      this.logger.error(`Failed to fetch department ${id}: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Create a new department
   */
  async create(name: string, description: string, parentId: string | null) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Insert new department
      const result = await client?.query(
        'INSERT INTO cmdb.departments (name, description, parent_id) VALUES ($1, $2, $3) RETURNING id',
        [name, description, parentId]
      );
      
      return result?.rows[0]?.id;
    } catch (error) {
      this.logger.error(`Failed to create department: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Update an existing department
   */
  async update(id: string, name: string, description: string, parentId: string | null) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Update department
      await client?.query(
        'UPDATE cmdb.departments SET name = $1, description = $2, parent_id = $3 WHERE id = $4',
        [name, description, parentId, id]
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to update department ${id}: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Delete a department and unassign all users from it
   */
  async delete(id: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Begin transaction
      await client.query('BEGIN');
      
      try {
        // First unassign all users from this department
        await client?.query(
          'DELETE FROM cmdb.department_users WHERE department_id = $1',
          [id]
        );
        
        // Then delete the department
        await client?.query(
          'DELETE FROM cmdb.departments WHERE id = $1',
          [id]
        );
        
        // Commit transaction
        await client.query('COMMIT');
      } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        throw error;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete department ${id}: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Add multiple users to a department
   */
  async addUsersToDepartment(departmentId: string, userIds: string[]) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // First check if department exists
      const departmentCheck = await client?.query(
        'SELECT id FROM cmdb.departments WHERE id = $1',
        [departmentId]
      );
      
      if (!departmentCheck?.rows.length) {
        throw new Error('Department not found');
      }

      // Begin transaction
      await client.query('BEGIN');
      
      try {
        // Check which users already have a department assigned
        const existingAssignments = await client?.query(
          'SELECT user_id FROM cmdb.department_users WHERE user_id = ANY($1)',
          [userIds]
        );

        // If any users already have a department, throw an error
        if (existingAssignments?.rows.length > 0) {
          const alreadyAssignedUsers = existingAssignments.rows.map(row => row.user_id);
          throw new Error(`Some users are already assigned to a department: ${alreadyAssignedUsers.join(', ')}`);
        }
        
        // Add users to department (using a prepared statement for multiple insertions)
        const insertQuery = `
          INSERT INTO cmdb.department_users (department_id, user_id)
          SELECT $1, unnest($2::uuid[])
        `;
        
        await client?.query(insertQuery, [
          departmentId,
          userIds
        ]);
        
        // Commit transaction
        await client.query('COMMIT');
      } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        throw error;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to add users to department ${departmentId}: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get all users that are assigned to departments
   */
  async getAssignedUsers() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query all users assigned to departments
      const result = await client?.query(`
        SELECT 
          du.user_id,
          du.department_id,
          d.name as department_name
        FROM 
          cmdb.department_users du
        JOIN 
          cmdb.departments d ON du.department_id = d.id
      `);
      
      return result?.rows || [];
    } catch (error) {
      this.logger.error(`Failed to fetch assigned users: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
  
  /**
   * Get all users in a specific department
   */
  async getDepartmentUsers(departmentId: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if department exists
      const departmentCheck = await client?.query(
        'SELECT id FROM cmdb.departments WHERE id = $1',
        [departmentId]
      );
      
      if (!departmentCheck?.rows.length) {
        throw new Error('Department not found');
      }
      
      // Query all users in department with user details
      const result = await client?.query(`
        SELECT 
          du.user_id,
          du.department_id,
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.email
        FROM 
          cmdb.department_users du
        JOIN 
          cmdb.users u ON du.user_id = u.id
        WHERE 
          du.department_id = $1
        ORDER BY
          u.last_name, u.first_name
      `, [departmentId]);
      
      return result?.rows || [];
    } catch (error) {
      this.logger.error(`Failed to fetch department users: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
  
  /**
   * Remove a user from a department
   */
  async removeUserFromDepartment(departmentId: string, userId: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Check if department exists
      const departmentCheck = await client?.query(
        'SELECT id FROM cmdb.departments WHERE id = $1',
        [departmentId]
      );
      
      if (!departmentCheck?.rows.length) {
        throw new Error('Department not found');
      }
      
      // Check if assignment exists
      const assignmentCheck = await client?.query(
        'SELECT user_id FROM cmdb.department_users WHERE department_id = $1 AND user_id = $2',
        [departmentId, userId]
      );
      
      if (!assignmentCheck?.rows.length) {
        throw new Error('User is not assigned to this department');
      }
      
      // Remove user from department
      await client?.query(
        'DELETE FROM cmdb.department_users WHERE department_id = $1 AND user_id = $2',
        [departmentId, userId]
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove user from department: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
}