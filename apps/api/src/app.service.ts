// apps/api/src/app.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseConfigService } from './database/database-config.service';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor(
    private readonly databaseConfigService: DatabaseConfigService,
    private readonly databaseService: DatabaseService
  ) {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    const config = this.databaseConfigService.getConfig();
    if (config?.isConfigured) {
      await this.databaseService.initializeFromConfig(config);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getDatabaseStatus(): Promise<{ isConfigured: boolean; isConnected: boolean; error?: string }> {
    const isConfigured = this.databaseConfigService.isDatabaseConfigured();
    
    // If not configured, no need to check connection
    if (!isConfigured) {
      return { isConfigured: false, isConnected: false };
    }
    
    try {
      // Test the database connection
      const config = this.databaseConfigService.getConfig();
      if (!config) {
        return { isConfigured: true, isConnected: false, error: 'Database configuration is invalid' };
      }
      
      const connectionResult = await this.databaseService.testConnection(config);
      return { 
        isConfigured: true, 
        isConnected: connectionResult.success,
        error: connectionResult.success ? undefined : connectionResult.message
      };
    } catch (error) {
      return { 
        isConfigured: true, 
        isConnected: false,
        error: error.message || 'Unknown database connection error'
      };
    }
  }
}