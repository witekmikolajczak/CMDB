// apps/web/src/services/UserPreferencesService.ts
import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Define response interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Service for managing user preferences
 */
class UserPreferencesService {
  /**
   * Get all preferences for the current user
   */
  async getAllPreferences(): Promise<Record<string, string>> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get<ApiResponse<Record<string, string>>>(`${API_URL}/user-preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data || {};
      }
      return {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }

  /**
   * Get a specific preference value
   */
  async getPreference(key: string): Promise<string | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get<ApiResponse<string>>(`${API_URL}/user-preferences/${key}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data || null;
      }
      return null;
    } catch (error) {
      console.error(`Error getting preference '${key}':`, error);
      return null;
    }
  }

  /**
   * Set a preference value
   */
  async setPreference(key: string, value: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post<ApiResponse<void>>(`${API_URL}/user-preferences/${key}`, { value }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.success || false;
    } catch (error) {
      console.error(`Error setting preference '${key}':`, error);
      return false;
    }
  }

  /**
   * Set multiple preferences at once
   */
  async setPreferences(preferences: Record<string, string>): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post<ApiResponse<void>>(`${API_URL}/user-preferences`, preferences, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.success || false;
    } catch (error) {
      console.error('Error setting multiple preferences:', error);
      return false;
    }
  }

  /**
   * Delete a preference
   */
  async deletePreference(key: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.delete<ApiResponse<void>>(`${API_URL}/user-preferences/${key}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.success || false;
    } catch (error) {
      console.error(`Error deleting preference '${key}':`, error);
      return false;
    }
  }

  /**
   * Delete all preferences for the current user
   */
  async deleteAllUserPreferences(): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.delete<ApiResponse<void>>(`${API_URL}/user-preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.success || false;
    } catch (error) {
      console.error('Error deleting all user preferences:', error);
      return false;
    }
  }
}

export default new UserPreferencesService();
