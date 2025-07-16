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
        "SELECT COUNT(*) as count FROM cmdb.asset_assignments WHERE status = 'active'",
      );

      return { count: parseInt(result?.rows[0].count) || 0 };
    } catch (error) {
      this.logger.error(
        `Failed to fetch active assignments count: ${error.message}`,
      );
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
        "SELECT COUNT(*) as countweek FROM cmdb.asset_assignments WHERE assignment_date >= NOW() - INTERVAL '1 week'",
      );

      return { count: parseInt(result?.rows[0].countweek) || 0 };
    } catch (error) {
      this.logger.error(
        `Failed to fetch assignments count for this week: ${error.message}`,
      );
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get all asset assignments with details
   */
  async getAllAssignments() {
    let client: PoolClient | null = null;

    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }

      client = await this.databaseService.getPool()!.connect();

      // Query all assignments with related information
      const result = await client?.query(`
        SELECT 
          aa.id,
          aa.asset_id,
          aa.assigned_to,
          aa.assigned_by,
          aa.assignment_date,
          aa.expected_return_date,
          aa.actual_return_date,
          aa.status,
          aa.purpose,
          aa.notes,
          -- Asset information
          a.name as asset_name,
          a.asset_tag,
          a.serial_number,
          at.name as asset_type,
          -- User information
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email,
          d.name as department_name,
          -- Assigned by information
          ab.first_name || ' ' || ab.last_name as assigned_by_name,
          ab.email as assigned_by_email
        FROM 
          cmdb.asset_assignments aa
        JOIN 
          cmdb.assets a ON aa.asset_id = a.id
        JOIN 
          cmdb.asset_types at ON a.asset_type_id = at.id
        LEFT JOIN 
          cmdb.users u ON aa.assigned_to = u.id
        LEFT JOIN 
          cmdb.departments d ON u.department_id = d.id
        LEFT JOIN 
          cmdb.users ab ON aa.assigned_by = ab.id
        ORDER BY 
          aa.assignment_date DESC
      `);

      // Transform the raw database rows to a more frontend-friendly format
      return (
        result?.rows.map((row) => ({
          id: row.id,
          asset: {
            id: row.asset_id,
            name: row.asset_name,
            assetTag: row.asset_tag,
            serialNumber: row.serial_number,
            type: row.asset_type,
          },
          assignedTo: {
            id: row.user_id,
            name: row.user_name,
            email: row.user_email,
            department: row.department_name,
          },
          assignedBy: {
            id: row.assigned_by,
            name: row.assigned_by_name,
            email: row.assigned_by_email,
          },
          assignmentDate: row.assignment_date,
          expectedReturnDate: row.expected_return_date,
          actualReturnDate: row.actual_return_date,
          status: row.status,
          purpose: row.purpose,
          notes: row.notes,
        })) || []
      );
    } catch (error) {
      this.logger.error(`Failed to fetch assignments: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Create a new asset assignment
   */
  async createAssignment(assignmentData: any) {
    let client: PoolClient | null = null;

    try {
      // Get database connection
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }

      client = await this.databaseService.getPool()!.connect();

      // Insert new assignment
      const result = await client?.query(
        `
        INSERT INTO cmdb.asset_assignments (
          asset_id,
          assigned_to,
          assigned_by,
          assignment_date,
          expected_return_date,
          status,
          purpose,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
        [
          assignmentData.assetId,
          assignmentData.userId,
          assignmentData.assignedBy,
          assignmentData.assignmentDate || new Date(),
          assignmentData.expectedReturnDate,
          assignmentData.status || 'active',
          assignmentData.purpose,
          assignmentData.notes,
        ],
      );

      // Get the newly created assignment with all details
      if (result?.rows[0]?.id) {
        const newAssignmentId = result.rows[0].id;
        console.log('Created assignment ID:', newAssignmentId);
        console.log('Raw DB result by ID:', result?.rows);
        // Fetch the complete assignment data
        return this.getAssignmentById(newAssignmentId, client);
      }

      throw new Error('Failed to create assignment');
    } catch (error) {
      this.logger.error(`Failed to create assignment: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get an assignment by ID (helper method)
   */
  private async getAssignmentById(
    id: number | string,
    existingClient?: PoolClient,
  ) {
    let client: PoolClient | null = existingClient || null;
    let shouldReleaseClient = false;

    try {
      if (!client) {
        // Get database connection if not provided
        if (!this.databaseService.getPool()) {
          throw new Error('Database not configured');
        }

        client = await this.databaseService.getPool()!.connect();
        shouldReleaseClient = true;
      }

      // Query assignment by ID
      const result = await client?.query(
        `
        SELECT 
          aa.id,
          aa.asset_id,
          aa.assigned_to,
          aa.assigned_by,
          aa.assignment_date,
          aa.expected_return_date,
          aa.actual_return_date,
          aa.status,
          aa.purpose,
          aa.notes,
          -- Asset information
          a.name as asset_name,
          a.asset_tag,
          a.serial_number,
          at.name as asset_type,
          -- User information
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email,
          d.name as department_name,
          -- Assigned by information
          ab.first_name || ' ' || ab.last_name as assigned_by_name,
          ab.email as assigned_by_email
        FROM 
          cmdb.asset_assignments aa
        JOIN 
          cmdb.assets a ON aa.asset_id = a.id
        JOIN 
          cmdb.asset_types at ON a.asset_type_id = at.id
        LEFT JOIN 
          cmdb.users u ON aa.assigned_to = u.id
        LEFT JOIN 
          cmdb.departments d ON u.department_id = d.id
        LEFT JOIN 
          cmdb.users ab ON aa.assigned_by = ab.id
        WHERE 
          aa.id = $1
      `,
        [id],
      );

      if (result?.rows.length === 0) {
        throw new Error(`Assignment with ID ${id} not found`);
      }

      const row = result?.rows[0];

      // Transform to frontend-friendly format
      return {
        id: row.id,
        asset: {
          id: row.asset_id,
          name: row.asset_name,
          assetTag: row.asset_tag,
          serialNumber: row.serial_number,
          type: row.asset_type,
        },
        assignedTo: {
          id: row.assigned_to,
          name: row.user_name,
          email: row.user_email,
          department: row.department_name,
        },
        assignedBy: {
          id: row.assigned_by,
          name: row.assigned_by_name,
          email: row.assigned_by_email,
        },
        assignmentDate: row.assignment_date,
        expectedReturnDate: row.expected_return_date,
        actualReturnDate: row.actual_return_date,
        status: row.status,
        purpose: row.purpose,
        notes: row.notes,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch assignment by ID: ${error.message}`);
      throw error;
    } finally {
      if (shouldReleaseClient && client) {
        client.release();
      }
    }
  }

  async getAssignmentByIdPublic(id: string) {
    let client: PoolClient | null = null;
    try {
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      client = await this.databaseService.getPool()!.connect();
      return await this.getAssignmentById(id, client);
    } catch (error) {
      this.logger.error(`Error fetching assignment ${id}: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  // Update assignment by ID
  async updateAssignment(id: string, data: any) {
    let client: PoolClient | null = null;
    try {
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      client = await this.databaseService.getPool()!.connect();

      const result = await client.query(
        `UPDATE cmdb.asset_assignments
         SET asset_id = $1,
             assigned_to = $2,
             expected_return_date = $3,
             status = $4,
             purpose = $5,
             notes = $6,
             updated_at = NOW()
         WHERE id = $7
         RETURNING id`,
        [
          data.assetId,
          data.userId,
          data.expectedReturnDate,
          data.status,
          data.purpose,
          data.notes,
          id,
        ],
      );

      if (result.rowCount === 0) {
        throw new Error(`Assignment ${id} not found`);
      }

      return await this.getAssignmentById(id, client);
    } catch (error) {
      this.logger.error(`Error updating assignment: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  // Delete assignment by ID
  async deleteAssignment(id: string) {
    let client: PoolClient | null = null;
    try {
      if (!this.databaseService.getPool()) {
        throw new Error('Database not configured');
      }
      client = await this.databaseService.getPool()!.connect();

      const result = await client.query(
        'DELETE FROM cmdb.asset_assignments WHERE id = $1',
        [id],
      );

      if (result.rowCount === 0) {
        throw new Error(`Assignment ${id} not found`);
      }

      return { success: true, message: 'Assignment deleted' };
    } catch (error) {
      this.logger.error(`Error deleting assignment: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }
}
