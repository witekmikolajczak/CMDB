// apps/api/src/database/database.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, Get } from '@nestjs/common';
import { DatabaseService, DatabaseConnectionConfig, AdminUserConfig } from './database.service';
import { DatabaseConfigService } from './database-config.service';
import { Public } from '../auth/auth.guard';

@Controller('database')
export class DatabaseController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly databaseConfigService: DatabaseConfigService
  ) {}

  @Public()
  @Get('status')
  async getStatus() {
    return {
      isConfigured: this.databaseConfigService.isDatabaseConfigured()
    };
  }

  @Public()
  @Post('test-connection')
  async testConnection(@Body() config: DatabaseConnectionConfig) {
    try {
      // Ensure password is a string
      if (config.password && typeof config.password !== 'string') {
        config.password = String(config.password);
      }
      
      const result = await this.databaseService.testConnection(config);
      
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Database connection test failed: ${error.message || 'Unknown error'}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public()
  @Post('execute-schema')
  async executeSchema(@Body() config: DatabaseConnectionConfig) {
    const result = await this.databaseService.executeDatabaseSchema(config);
    
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
    
    return result;
  }

  @Public()
  @Post('create-admin')
  async createAdminUser(
    @Body() payload: { dbConfig: DatabaseConnectionConfig, adminConfig: AdminUserConfig }
  ) {
    const result = await this.databaseService.createAdminUser(
      payload.dbConfig, 
      payload.adminConfig
    );
    
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
    
    // Save the database configuration
    this.databaseConfigService.saveConfig({
      ...payload.dbConfig,
      isConfigured: true
    });
    
    return result;
  }
}