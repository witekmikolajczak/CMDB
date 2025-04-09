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
      
      // Query all departments
      const result = await client?.query(
        'SELECT id, name, description, parent_id FROM cmdb.departments ORDER BY name'
      );
      
      return result?.rows || [];
    } catch (error) {
      this.logger.error(`Failed to fetch departments: ${error.message}`);
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
   * Delete a department
   */
  async delete(id: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Delete department
      await client?.query(
        'DELETE FROM cmdb.departments WHERE id = $1',
        [id]
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete department ${id}: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
}