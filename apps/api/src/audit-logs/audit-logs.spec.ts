// apps/api/src/audit-logs/audit-logs.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService, AuditAction } from './audit-logs.service';
import { EventLoggerService } from './event-logger.service';
import { DatabaseService } from '../database/database.service';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Audit Logging System', () => {
  let app: INestApplication;
  let auditLogsService: AuditLogsService;
  let eventLoggerService: EventLoggerService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    auditLogsService = moduleFixture.get<AuditLogsService>(AuditLogsService);
    eventLoggerService = moduleFixture.get<EventLoggerService>(EventLoggerService);
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AuditLogsService', () => {
    it('should create audit_logs table if it does not exist', async () => {
      // First, drop the table if it exists to test creation
      try {
        const pool = databaseService.getPool();
        if (pool) {
          const client = await pool.connect();
          await client.query('DROP TABLE IF EXISTS cmdb.audit_logs');
          client.release();
        }
      } catch (error) {
        console.error('Error dropping table:', error);
      }

      // Now create the table
      await auditLogsService.ensureAuditLogTableExists();

      // Verify table exists
      let result;
      const pool = databaseService.getPool();
      if (pool) {
        const client = await pool.connect();
        result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'cmdb' 
            AND table_name = 'audit_logs'
          );
        `);
        client.release();
      }

      expect(result.rows[0].exists).toBe(true);
    });

    it('should log an audit event', async () => {
      const testEntry = {
        action: AuditAction.SYSTEM_EVENT,
        entityType: 'test',
        entityId: '123',
        userId: 'test-user',
        username: 'testuser',
        additionalInfo: { test: true }
      };

      // Log the test entry
      await auditLogsService.log(testEntry);

      // Retrieve the entry
      // Query the logs directly from the database
      let result;
      const pool = databaseService.getPool();
      if (pool) {
        const client = await pool.connect();
        result = await client.query(`
          SELECT * FROM cmdb.audit_logs 
          WHERE entity_type = 'test' AND entity_id = '123'
          ORDER BY timestamp DESC
          LIMIT 1
        `);
        client.release();
      }

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].action).toBe(AuditAction.SYSTEM_EVENT);
      expect(result.rows[0].entity_type).toBe('test');
      expect(result.rows[0].entity_id).toBe('123');
    });
  });

  describe('EventLoggerService', () => {
    it('should log system events', async () => {
      await eventLoggerService.logSystemEvent(
        AuditAction.SYSTEM_EVENT,
        'system',
        'startup',
        { message: 'System started' },
        'system',
        'system'
      );

      // Query the logs directly from the database
      let result;
      const pool = databaseService.getPool();
      if (pool) {
        const client = await pool.connect();
        result = await client.query(`
          SELECT * FROM cmdb.audit_logs 
          WHERE entity_type = 'system' AND entity_id = 'startup'
          ORDER BY timestamp DESC
          LIMIT 1
        `);
        client.release();
      }

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].action).toBe(AuditAction.SYSTEM_EVENT);
      expect(result.rows[0].additional_info).toHaveProperty('message', 'System started');
    });

    it('should log security events', async () => {
      await eventLoggerService.logSecurityEvent(
        AuditAction.PERMISSION_CHANGE,
        'role',
        'admin',
        { permission: 'added', resource: 'users' },
        'admin-user',
        'admin'
      );

      // Query the logs directly from the database
      let result;
      const pool = databaseService.getPool();
      if (pool) {
        const client = await pool.connect();
        result = await client.query(`
          SELECT * FROM cmdb.audit_logs 
          WHERE action = $1
          ORDER BY timestamp DESC
          LIMIT 1
        `, [AuditAction.PERMISSION_CHANGE]);
        client.release();
      }

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].entity_type).toBe('role');
      expect(result.rows[0].additional_info).toHaveProperty('securityEvent', true);
    });
  });

  describe('HTTP Request Logging', () => {
    it('should log HTTP requests via interceptor', async () => {
      // Make a test request
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer test-token')
        .expect(401); // Will be unauthorized but should still log

      // Check if the request was logged
      // Query the logs directly from the database
      let result;
      const pool = databaseService.getPool();
      if (pool) {
        const client = await pool.connect();
        result = await client.query(`
          SELECT * FROM cmdb.audit_logs 
          WHERE entity_type = 'users'
          ORDER BY timestamp DESC
          LIMIT 1
        `);
        client.release();
      }

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].action).toBe(AuditAction.READ);
    });
  });

  describe('Data Change Tracking', () => {
    it('should track data changes with previous and current values', async () => {
      // This would require a more complex setup with authenticated requests
      // and actual data changes, but the concept is:
      
      // 1. Create test user
      // 2. Authenticate
      // 3. Make data change request
      // 4. Verify log contains previous and current values
      
      // For simplicity, we'll just verify the structure exists
      const testEntry = {
        action: AuditAction.UPDATE,
        entityType: 'users',
        entityId: 'test-user',
        userId: 'admin',
        username: 'admin',
        previousValue: { name: 'Old Name' },
        currentValue: { name: 'New Name' }
      };

      await auditLogsService.log(testEntry);

      // Query the logs directly from the database
      let result;
      const pool = databaseService.getPool();
      if (pool) {
        const client = await pool.connect();
        result = await client.query(`
          SELECT * FROM cmdb.audit_logs 
          WHERE action = $1 AND entity_type = $2 AND entity_id = $3
          ORDER BY timestamp DESC
          LIMIT 1
        `, [AuditAction.UPDATE, 'users', 'test-user']);
        client.release();
      }

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].previous_value).toHaveProperty('name', 'Old Name');
      expect(result.rows[0].current_value).toHaveProperty('name', 'New Name');
    });
  });
});
