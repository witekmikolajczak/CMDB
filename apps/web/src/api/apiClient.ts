// apps/web/src/api/apiClient.ts
import { authService } from '../services/authService';

// Base API URL - in a real app, this would be from environment variables
const API_BASE_URL = 'http://localhost:3001';

// Define the database connection configuration interface
export interface DatabaseConnectionConfig {
  hostname: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

// Define the admin user configuration interface
export interface AdminUserConfig {
  username: string;
  email: string;
  password: string;
}

/**
 * Helper function to include auth headers in requests
 */
const getHeaders = (contentType = true) => {
  const headers: Record<string, string> = {};
  
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  const authHeader = authService.getAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader.Authorization;
  }
  
  return headers;
};

/**
 * Check database configuration status
 */
export const checkDatabaseStatus = async (): Promise<{
    isConfigured: boolean;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
  
      if (!response.ok) {
        return { isConfigured: false };
      }
  
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return { isConfigured: false };
    }
  };

/**
 * Test the database connection with provided credentials
 */
export const testDatabaseConnection = async (config: DatabaseConnectionConfig): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/database/test-connection`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Connection test failed',
      };
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Execute the database schema SQL
 */
export const executeDatabaseSchema = async (config: DatabaseConnectionConfig): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/database/execute-schema`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Schema execution failed',
      };
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Create the admin user in the database
 */
export const createAdminUser = async (
  dbConfig: DatabaseConnectionConfig,
  adminConfig: AdminUserConfig
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/database/create-admin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        dbConfig,
        adminConfig,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Admin user creation failed',
      };
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Get the list of assets
 */
export const getAssets = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch assets');
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get the list of users
 */
export const getUsers = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get the list of departments
 */
export const getDepartments = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch departments');
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Generic API request function with authentication
 */
export const apiRequest = async (
  endpoint: string, 
  method = 'GET', 
  data?: any
): Promise<any> => {
  try {
    const options: RequestInit = {
      method,
      headers: getHeaders(!!data),
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Request to ${endpoint} failed`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Get the count of users in the system
 */
export const getUsersCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/count`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch users count');
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('API request failed:', error);
    // Return 0 as a fallback
    return 0;
  }
};

/**
 * Get the count of users created this week
 */
export const getUsersCountThisWeek = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/countWeek`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch weekly users count');
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('API request failed:', error);
    // Return 0 as a fallback
    return 0;
  }
};

/**
 * Get the count of departments
 */
export const getDepartmentsCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/count`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch departments count');
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('API request failed:', error);
    // Return 0 as a fallback
    return 0;
  }
};

/**
 * Get the count of assets
 */
export const getAssetsCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets/count`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch assets count');
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('API request failed:', error);
    // Return 0 as a fallback
    return 0;
  }
};

/**
 * Get the count of assets added this month
 */
export const getAssetsCountThisMonth = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets/countMonth`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch monthly assets count');
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('API request failed:', error);
    // Return 0 as a fallback
    return 0;
  }
};

/**
 * Get the count of active assignments
 */
export const getActiveAssignmentsCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments/count`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch active assignments count');
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('API request failed:', error);
    // Return 0 as a fallback
    return 0;
  }
};

/**
 * Get the count of assignments created this week
 */
export const getAssignmentsCountThisWeek = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments/countWeek`, {
      headers: getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch weekly assignments count');
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('API request failed:', error);
    // Return 0 as a fallback
    return 0;
  }
};