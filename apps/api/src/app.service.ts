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

  getDatabaseStatus(): { isConfigured: boolean } {
    return { 
      isConfigured: this.databaseConfigService.isDatabaseConfigured() 
    };
  }
}