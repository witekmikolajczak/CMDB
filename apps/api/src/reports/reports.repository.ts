import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PoolClient } from 'pg';

@Injectable()
export class ReportsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createGeneratedReport(data: {
    reportId?: number;
    fileType: string;
    fileSize: number;
    filePath?: string;
    status: string;
    isScheduled?: boolean;
    generatedBy?: string;
    parametersUsed?: any;
  }): Promise<{ id: number }> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database not initialized');

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO report_results (
          report_id, file_type, file_size, file_path, status, is_scheduled, generated_by, parameters_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          data.reportId || null,
          data.fileType,
          data.fileSize,
          data.filePath || null,
          data.status,
          data.isScheduled || false,
          data.generatedBy || null,
          data.parametersUsed || null,
        ],
      );
      return { id: result.rows[0].id };
    } finally {
      client.release();
    }
  }

  async getGeneratedReports(limit = 50): Promise<any[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database not initialized');

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, file_type, file_size, file_path, status, is_scheduled,
                generated_by, parameters_used, generated_at
         FROM report_results
         ORDER BY generated_at DESC
         LIMIT $1`,
        [limit],
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getReportFileInfo(id: number): Promise<any | null> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database not initialized');

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM report_results WHERE id = $1`,
        [id],
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
}
