// apps/api/src/audit-logs/audit-logs.service.ts
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from '../database/database.service';
import { Request } from 'express';

export enum AuditAction {
  LOGIN = 'login',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  IMPORT = 'import',
  EXPORT = 'export',
  CONFIG_CHANGE = 'config_change',
  PERMISSION_CHANGE = 'permission_change',
  ROLE_CHANGE = 'role_change',
  ERROR = 'error',
  SYSTEM_EVENT = 'system_event'
}

export interface AuditLogEntry {
  action: AuditAction | string;
  entityType: string;
  entityId?: string | number;
  userId?: string | number;
  username?: string;
  hostname?: string;
  ipAddress?: string;
  previousValue?: any;
  currentValue?: any;
  additionalInfo?: any;
}

@Injectable()
export class AuditLogsService {
  private pool: Pool | null = null;

  constructor(private readonly databaseService: DatabaseService) {
    // Get the database pool from the database service
    this.pool = this.databaseService.getPool();
  }

  /**
   * Create audit log table if it doesn't exist
   */
  async ensureAuditLogTableExists(): Promise<boolean> {
    if (!this.pool) {
      console.error('Database pool not initialized');
      return false;
    }

    const client = await this.pool.connect();
    try {
      // Check if the cmdb schema exists
      const schemaCheckResult = await client.query(
        "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cmdb')"
      );
      
      if (!schemaCheckResult.rows[0].exists) {
        console.error('Database schema not found');
        return false;
      }

      // Create audit_logs table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS cmdb.audit_logs (
          id SERIAL PRIMARY KEY,
          action VARCHAR(50) NOT NULL,
          entity_type VARCHAR(100) NOT NULL,
          entity_id VARCHAR(100),
          user_id INTEGER,
          username VARCHAR(100),
          hostname VARCHAR(255),
          ip_address VARCHAR(45),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          previous_value JSONB,
          current_value JSONB,
          additional_info JSONB,
          CONSTRAINT fk_user
            FOREIGN KEY(user_id) 
            REFERENCES cmdb.users(id)
            ON DELETE SET NULL
        );
        
        -- Index for faster queries
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON cmdb.audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON cmdb.audit_logs(entity_type);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON cmdb.audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON cmdb.audit_logs(timestamp);
      `);

      return true;
    } catch (error) {
      console.error('Error creating audit log table:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Log an audit event
   */
  async log(logEntry: AuditLogEntry, req?: Request): Promise<boolean> {
    if (!this.pool) {
      console.error('Database pool not initialized');
      return false;
    }

    // Ensure the audit log table exists
    await this.ensureAuditLogTableExists();

    // Extract IP address and hostname from request if available
    if (req) {
      logEntry.ipAddress = req.ip || req.socket.remoteAddress;
      // Try to get hostname from headers
      logEntry.hostname = req.headers['x-forwarded-host'] as string || 
                          req.headers.host || 
                          'unknown';
    }

    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO cmdb.audit_logs (
          action, 
          entity_type, 
          entity_id, 
          user_id, 
          username, 
          hostname, 
          ip_address, 
          previous_value, 
          current_value, 
          additional_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        logEntry.action,
        logEntry.entityType,
        logEntry.entityId,
        logEntry.userId,
        logEntry.username,
        logEntry.hostname,
        logEntry.ipAddress,
        logEntry.previousValue ? JSON.stringify(logEntry.previousValue) : null,
        logEntry.currentValue ? JSON.stringify(logEntry.currentValue) : null,
        logEntry.additionalInfo ? JSON.stringify(logEntry.additionalInfo) : null,
      ]);

      return true;
    } catch (error) {
      console.error('Error logging audit event:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get audit logs with optional filtering
   */
  async getAuditLogs(
    page = 1,
    limit = 50,
    filters?: {
      action?: string;
      entityType?: string;
      entityId?: string;
      userId?: number;
      username?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ) {
    if (!this.pool) {
      console.error('Database pool not initialized');
      return { logs: [], total: 0 };
    }

    const client = await this.pool.connect();
    try {
      // Build the query with filters
      let query = 'SELECT * FROM cmdb.audit_logs WHERE 1=1';
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (filters) {
        if (filters.action) {
          query += ` AND action = $${paramIndex++}`;
          queryParams.push(filters.action);
        }
        if (filters.entityType) {
          query += ` AND entity_type = $${paramIndex++}`;
          queryParams.push(filters.entityType);
        }
        if (filters.entityId) {
          query += ` AND entity_id = $${paramIndex++}`;
          queryParams.push(filters.entityId);
        }
        if (filters.userId) {
          query += ` AND user_id = $${paramIndex++}`;
          queryParams.push(filters.userId);
        }
        if (filters.username) {
          query += ` AND username ILIKE $${paramIndex++}`;
          queryParams.push(`%${filters.username}%`);
        }
        if (filters.fromDate) {
          query += ` AND timestamp >= $${paramIndex++}`;
          queryParams.push(filters.fromDate);
        }
        if (filters.toDate) {
          query += ` AND timestamp <= $${paramIndex++}`;
          queryParams.push(filters.toDate);
        }
      }

      // Count total matching records
      const countResult = await client.query(
        `SELECT COUNT(*) FROM (${query}) AS filtered_logs`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);

      // Execute the query
      const result = await client.query(query, queryParams);

      return {
        logs: result.rows,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      return { logs: [], total: 0, page, limit, pages: 0 };
    } finally {
      client.release();
    }
  }
}
