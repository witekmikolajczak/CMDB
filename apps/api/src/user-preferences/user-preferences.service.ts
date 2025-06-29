// apps/api/src/user-preferences/user-preferences.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all preferences for a user
   */
  async getUserPreferences(userId: string): Promise<any> {
    try {
      const pool = this.databaseService.getPool();
      if (!pool) {
        throw new Error('Database connection not initialized');
      }

      const result = await pool.query(
        `SELECT preference_key, preference_value
         FROM cmdb.user_preferences
         WHERE user_id = $1`,
        [userId]
      );

      // Convert to key-value object
      const preferences = {};
      result.rows.forEach(row => {
        preferences[row.preference_key] = row.preference_value;
      });

      return { success: true, data: preferences };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get a specific preference for a user
   */
  async getUserPreference(userId: string, key: string): Promise<any> {
    try {
      const pool = this.databaseService.getPool();
      if (!pool) {
        throw new Error('Database connection not initialized');
      }

      const result = await pool.query(
        `SELECT preference_value
         FROM cmdb.user_preferences
         WHERE user_id = $1 AND preference_key = $2`,
        [userId, key]
      );

      if (result.rows.length === 0) {
        return { success: true, data: null };
      }

      return { success: true, data: result.rows[0].preference_value };
    } catch (error) {
      console.error('Error getting user preference:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Set a preference for a user
   */
  async setUserPreference(userId: string, key: string, value: string): Promise<any> {
    try {
      const pool = this.databaseService.getPool();
      if (!pool) {
        throw new Error('Database connection not initialized');
      }

      // Use upsert (insert or update) with ON CONFLICT
      await pool.query(
        `INSERT INTO cmdb.user_preferences (user_id, preference_key, preference_value, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, preference_key)
         DO UPDATE SET preference_value = $3, updated_at = NOW()`,
        [userId, key, value]
      );

      return { success: true, message: 'Preference updated successfully' };
    } catch (error) {
      console.error('Error setting user preference:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Set multiple preferences for a user at once
   */
  async setUserPreferences(userId: string, preferences: Record<string, string>): Promise<any> {
    try {
      const pool = this.databaseService.getPool();
      if (!pool) {
        throw new Error('Database connection not initialized');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const [key, value] of Object.entries(preferences)) {
          await client.query(
            `INSERT INTO cmdb.user_preferences (user_id, preference_key, preference_value, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, preference_key)
             DO UPDATE SET preference_value = $3, updated_at = NOW()`,
            [userId, key, value]
          );
        }

        await client.query('COMMIT');
        return { success: true, message: 'Preferences updated successfully' };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error setting user preferences:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete a preference for a user
   */
  async deleteUserPreference(userId: string, key: string): Promise<any> {
    try {
      const pool = this.databaseService.getPool();
      if (!pool) {
        throw new Error('Database connection not initialized');
      }

      await pool.query(
        `DELETE FROM cmdb.user_preferences
         WHERE user_id = $1 AND preference_key = $2`,
        [userId, key]
      );

      return { success: true, message: 'Preference deleted successfully' };
    } catch (error) {
      console.error('Error deleting user preference:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete all preferences for a user
   */
  async deleteAllUserPreferences(userId: string): Promise<any> {
    try {
      const pool = this.databaseService.getPool();
      if (!pool) {
        throw new Error('Database connection not initialized');
      }

      await pool.query(
        `DELETE FROM cmdb.user_preferences
         WHERE user_id = $1`,
        [userId]
      );

      return { success: true, message: 'All preferences deleted successfully' };
    } catch (error) {
      console.error('Error deleting all user preferences:', error);
      return { success: false, message: error.message };
    }
  }
}
