import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export interface DatabaseConnectionConfig {
  hostname: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface AdminUserConfig {
  username: string;
  email: string;
  password: string;
}

@Injectable()
export class DatabaseService {
  private pool: Pool | null = null;

  /**
   * Get the database connection pool
   */
  getPool(): Pool | null {
    return this.pool;
  }

  /**
   * Initialize with existing configuration
   */
  async initializeFromConfig(
    config: DatabaseConnectionConfig,
  ): Promise<boolean> {
    try {
      this.initializeConnection(config);
      const client = await this.pool?.connect();
      if (client) {
        client.release();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize from saved config:', error);
      return false;
    }
  }

  /**
   * Test the database connection with provided credentials
   */
  async testConnection(
    config: DatabaseConnectionConfig,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const tempPool = new Pool({
        host: config.hostname,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        connectionTimeoutMillis: 5000,
      });

      // Try to connect
      const client = await tempPool.connect();
      client.release();
      await tempPool.end();

      return { success: true, message: 'Connection successful!' };
    } catch (error) {
      console.error('Database connection error:', error);
      return {
        success: false,
        message: `Connection failed: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Initialize the database connection pool
   */
  initializeConnection(config: DatabaseConnectionConfig): void {
    try {
      // Validate password is a string before creating the pool
      if (typeof config.password !== 'string') {
        console.error('Database password must be a string');
        config.password = String(config.password || ''); // Convert to string or use empty string
      }

      this.pool = new Pool({
        host: config.hostname,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
      });

      // Add error handler to the pool
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      this.pool = null;
    }
  }

  /**
   * Execute the database schema using Prisma migrations
   */
  async executeDatabaseSchema(
    config: DatabaseConnectionConfig,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Initialize connection if not already done
      if (!this.pool) {
        this.initializeConnection(config);
      }

      // Now check if pool is still null (in case initialization failed)
      if (!this.pool) {
        return {
          success: false,
          message: 'Failed to initialize database connection pool',
        };
      }

      const client = await this.pool.connect();

      try {
        // First, ensure a clean slate before executing schema script
        // This block will drop and recreate the schema to ensure we don't have conflicts
        await client.query(`
          -- Disable triggers and drop constraints for clean removal
          SET session_replication_role = replica;
          
          -- Drop the schema with CASCADE to remove all objects 
          DROP SCHEMA IF EXISTS cmdb CASCADE;
          
          -- Create the empty schema again
          CREATE SCHEMA cmdb;
          
          -- Set the search path
          SET search_path TO cmdb, public;
          
          -- Re-enable triggers
          SET session_replication_role = DEFAULT;
        `);

        client.release();

        // Create a .env file for Prisma with the database connection URL
        const databaseUrl = `postgresql://${config.username}:${config.password}@${config.hostname}:${config.port}/${config.database}?schema=cmdb`;
        
        // Create .env file for prisma in the project root
        const envFilePath = path.join(process.cwd(), '.env');
        fs.writeFileSync(envFilePath, `DATABASE_URL="${databaseUrl}"
`);

        console.log('Created .env file with DATABASE_URL for Prisma');

        // Run Prisma migrations using child_process
        const { execSync } = require('child_process');
        console.log('Running Prisma migrations...');
        
        try {
          // Generate Prisma client
          execSync('npx prisma generate', {
            stdio: 'inherit',
            cwd: process.cwd(),
          });

          // Deploy migrations
          execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            cwd: process.cwd(),
          });

          console.log('Successfully executed Prisma migrations');

          return {
            success: true,
            message: 'Database schema created successfully using Prisma migrations!',
          };
        } catch (migrationError) {
          console.error('Prisma migration error:', migrationError);
          return {
            success: false,
            message: `Prisma migration failed: ${migrationError.message || 'Unknown error'}`,
          };
        }
      } catch (error) {
        console.error('Schema execution error:', error);
        return {
          success: false,
          message: `Schema execution failed: ${error.message || 'Unknown error'}`,
        };
      }
    } catch (error) {
      console.error('Database operation error:', error);
      return {
        success: false,
        message: `Database operation failed: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Clear the database by dropping all objects and recreate the schema
   */
  async clearDatabaseAndRecreateSchema(
    config: DatabaseConnectionConfig,
  ): Promise<{ success: boolean; message: string }> {
    let client: PoolClient | null = null;

    try {
      // Initialize connection if not already done
      if (!this.pool) {
        this.initializeConnection(config);
      }

      // Check if pool is still null after initialization
      if (!this.pool) {
        return {
          success: false,
          message: 'Failed to initialize database connection pool',
        };
      }

      client = await this.pool.connect();

      // Start transaction
      await client.query('BEGIN');

      try {
        // Drop the entire schema and recreate it (simpler approach)
        await client.query(`
          -- Disable triggers and drop constraints for clean removal
          SET session_replication_role = replica;
          
          -- Drop the schema with CASCADE to remove all objects
          DROP SCHEMA IF EXISTS cmdb CASCADE;
          
          -- Create the empty schema again
          CREATE SCHEMA cmdb;
          
          -- Re-enable triggers
          SET session_replication_role = DEFAULT;
        `);

        // Commit the transaction
        await client.query('COMMIT');

        // Now re-execute the schema
        client.release();
        client = null; // Set to null to prevent double release in finally block
        const schemaResult = await this.executeDatabaseSchema(config);

        if (schemaResult.success) {
          return {
            success: true,
            message: 'Database cleared and schema recreated successfully!',
          };
        } else {
          return schemaResult;
        }
      } catch (error) {
        // Rollback the transaction in case of error
        if (client) {
          await client.query('ROLLBACK');
        }
        console.error('Database clearing error:', error);
        return {
          success: false,
          message: `Failed to clear database: ${error.message || 'Unknown error'}`,
        };
      }
    } catch (error) {
      console.error('Database operation error:', error);
      return {
        success: false,
        message: `Database operation failed: ${error.message || 'Unknown error'}`,
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Create the admin user in the database
   */
  async createAdminUser(
    dbConfig: DatabaseConnectionConfig,
    adminConfig: AdminUserConfig,
  ): Promise<{ success: boolean; message: string }> {
    let client: PoolClient | null = null;

    try {
      // Initialize connection if not already done
      if (!this.pool) {
        this.initializeConnection(dbConfig);
      }

      // Check if pool is still null after initialization
      if (!this.pool) {
        return {
          success: false,
          message: 'Failed to initialize database connection pool',
        };
      }

      client = await this.pool.connect();

      // Start transaction
      await client.query('BEGIN');

      // Check if the cmdb schema and users table exist
      const schemaCheckResult = await client.query(
        "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cmdb')",
      );

      if (!schemaCheckResult.rows[0].exists) {
        return {
          success: false,
          message: 'Database schema not found. Please create the schema first.',
        };
      }

      // Check if users table exists
      const tableCheckResult = await client.query(
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'cmdb' AND table_name = 'users')",
      );

      if (!tableCheckResult.rows[0].exists) {
        return {
          success: false,
          message: 'Users table not found. Please create the schema first.',
        };
      }

      // Check if admin user already exists
      const userCheckResult = await client.query(
        'SELECT COUNT(*) FROM cmdb.users WHERE username = $1 OR email = $2',
        [adminConfig.username, adminConfig.email],
      );

      if (parseInt(userCheckResult.rows[0].count) > 0) {
        return {
          success: false,
          message: 'An admin user with this username or email already exists.',
        };
      }

      // Generate a bcrypt hash for the password (would normally use bcrypt but using a placeholder)
      // In a real app, you would use bcrypt.hash() - this is just a placeholder
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(adminConfig.password, 10);

      // Insert the admin user
      await client.query(
        `INSERT INTO cmdb.users (
          username, password_hash, email, first_name, last_name, 
          employee_id, role_id, status_id, position_title
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )`,
        [
          adminConfig.username,
          hashedPassword,
          adminConfig.email,
          'Admin', // First name
          'User', // Last name
          'ADMIN001', // Employee ID
          1, // role_id (1 for admin role)
          1, // status_id (1 for active status)
          'System Administrator', // Position
        ],
      );

      // Commit transaction
      await client.query('COMMIT');

      return {
        success: true,
        message: 'Admin user created successfully!',
      };
    } catch (error) {
      // Rollback transaction if there was an error
      if (client) {
        await client.query('ROLLBACK');
      }

      console.error('Admin user creation error:', error);
      return {
        success: false,
        message: `Admin user creation failed: ${error.message || 'Unknown error'}`,
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Close the database connection pool
   */
  async closeConnection(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
