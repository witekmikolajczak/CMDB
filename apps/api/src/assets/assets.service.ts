// apps/api/src/assets/assets.service.ts
import { Injectable, Logger } from '@nestjs/common';
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
}
