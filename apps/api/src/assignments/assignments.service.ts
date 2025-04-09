// apps/api/src/assignments/assignments.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PoolClient } from 'pg';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get the total count of active assignments
   */
  async getActiveAssignmentsCount() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query active assignments count
      const result = await client?.query(
        "SELECT COUNT(*) as count FROM cmdb.asset_assignments WHERE status = 'active'"
      );
      
      return { count: parseInt(result?.rows[0].count) || 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch active assignments count: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get the count of assignments created this week
   */
  async getAssignmentsCountThisWeek() {
    let client: PoolClient | null = null;
    
    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      
      client = await this.databaseService.getPool()!.connect();
      
      // Query assignments count for this week
      const result = await client?.query(
        "SELECT COUNT(*) as countweek FROM cmdb.asset_assignments WHERE assignment_date >= NOW() - INTERVAL '1 week'"
      );
      
      return { count: parseInt(result?.rows[0].countweek) || 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch assignments count for this week: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
}
