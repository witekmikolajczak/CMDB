// apps/api/src/assets/assets.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PoolClient } from 'pg';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get the total count of assets
   */
  async getAssetsCount() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query assets count
      const result = await client?.query(
        'SELECT COUNT(*) as count FROM cmdb.assets'
      );
      
      return { count: parseInt(result?.rows[0].count) || 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch assets count: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get the count of assets added this month
   */
  async getAssetsCountThisMonth() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query assets count for this month
      const result = await client?.query(
        "SELECT COUNT(*) as countmonth FROM cmdb.assets WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)"
      );
      
      return { count: parseInt(result?.rows[0].countmonth) || 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch assets count for this month: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Create a new asset
   */
  async createAsset(assetData: any) {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Prepare column names and values placeholders
      const columns = Object.keys(assetData);
      const values = Object.values(assetData);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

      // Build the query
      const query = `
        INSERT INTO cmdb.assets (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *;
      `;
      
      // Execute the query with the asset data
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create asset');
      }
      
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Failed to create asset: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get all assets
   */
  async getAllAssets() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query to get all assets with creator information
      const query = `
        SELECT a.*, 
               u.first_name || ' ' || u.last_name as created_by_name,
               d.name as department_name,
               at.name as asset_type_name
        FROM cmdb.assets a
        LEFT JOIN cmdb.users u ON a.created_by = u.id
        LEFT JOIN cmdb.departments d ON a.department_id = d.id
        LEFT JOIN cmdb.asset_types at ON a.asset_type_id = at.id
        ORDER BY a.created_at DESC;
      `;
      
      const result = await client.query(query);
      
      return result.rows;
    } catch (error) {
      this.logger.error(`Failed to fetch assets: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
}
