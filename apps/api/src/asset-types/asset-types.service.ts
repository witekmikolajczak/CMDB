// apps/api/src/asset-types/asset-types.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PoolClient } from 'pg';

@Injectable()
export class AssetTypesService {
  private readonly logger = new Logger(AssetTypesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all asset types
   */
  async findAll() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query all asset types
      const result = await client?.query(
        'SELECT * FROM cmdb.asset_types ORDER BY name'
      );
      
      return result?.rows || [];
    } catch (error) {
      this.logger.error(`Failed to fetch asset types: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get asset type by ID
   */
  async findById(id: string) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query asset type by ID
      const result = await client?.query(
        'SELECT * FROM cmdb.asset_types WHERE id = $1',
        [id]
      );
      
      if (result?.rows.length === 0) {
        throw new NotFoundException(`Asset type with ID ${id} not found`);
      }
      
      return result?.rows[0];
    } catch (error) {
      this.logger.error(`Failed to fetch asset type: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Create a new asset type
   */
  async create(name: string, description: string, categoryId: number = 1) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Insert new asset type
      const result = await client?.query(
        `INSERT INTO cmdb.asset_types (name, description, category_id, has_serial_number, has_mac_address, has_imei) 
         VALUES ($1, $2, $3, true, false, false) 
         RETURNING *`,
        [name, description, categoryId]
      );
      
      return result?.rows[0];
    } catch (error) {
      this.logger.error(`Failed to create asset type: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get the count of asset types
   */
  async getAssetTypesCount() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query asset types count
      const result = await client?.query(
        'SELECT COUNT(*) as count FROM cmdb.asset_types'
      );
      
      return { count: parseInt(result?.rows[0].count) || 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch asset types count: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
}
