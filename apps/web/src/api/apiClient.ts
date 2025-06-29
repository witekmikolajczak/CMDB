// apps/web/src/api/apiClient.ts
import { authService } from '../services/authService';
import axios from 'axios';

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
    isConnected: boolean;
    error?: string;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
  
      if (!response.ok) {
        return { isConfigured: false, isConnected: false };
      }
  
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        isConfigured: false, 
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
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
 * Clear database configuration
 */
export const clearDatabaseConfig = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/database/clear-config`, {
      method: 'POST',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Failed to clear database configuration',
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
 * Clear all database objects and recreate the schema
 * Warning: This will delete all data in the database
 */
export const clearDatabaseAndRecreateSchema = async (config: DatabaseConnectionConfig): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/database/clear-and-recreate-schema`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Database clearing failed',
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
    const response = await axios.get(`${API_BASE_URL}/assets`, {
      headers: getHeaders(true)
    });
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to fetch assets: ${response.status}`);
    }
  } catch (error) {
    console.error('API request failed:', error);
    // Return empty array to prevent UI errors
    return [];
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
 * Get the list of departments from local storage
 */
export const getDepartments = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      headers: getHeaders(false),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Failed to get departments:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Failed to get departments:', error);
    return [];
  }
};

/**
 * Create a new department and save it to local storage
 */
export const createDepartment = async (name: string, description?: string): Promise<any> => {
  try {
    // Add default description if not provided
    const descToUse = description || "Added from Asset form";
    
    const response = await axios.post(`${API_BASE_URL}/departments`, { 
      name, 
      description: descToUse 
    }, {
      headers: getHeaders(true)
    });
    
    if (response.status === 200 || response.status === 201) {
      return response.data;
    } else {
      throw new Error(`Failed to create department: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to create department:', error);
    throw error;
  }
};

/**
 * Update an existing department
 */
export const updateDepartment = async (id: string | number, name: string, description?: string): Promise<any> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/departments/${id}`, { 
      name, 
      description: description || ''
    }, {
      headers: getHeaders(true)
    });
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to update department: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to update department:', error);
    throw error;
  }
};

/**
 * Delete a department and unassign all users from it
 */
export const deleteDepartment = async (id: string | number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/departments/${id}`, {
      headers: getHeaders(true)
    });
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to delete department: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to delete department:', error);
    throw error;
  }
};

/**
 * Get the list of asset types from the API
 */
export const getAssetTypes = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-types`, {
      headers: getHeaders(false),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error(`Failed to get asset types: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error('Failed to get asset types:', error);
    return [];
  }
};

/**
 * Create a new asset type and save it to the API
 */
export const createAssetType = async (name: string, description?: string): Promise<any> => {
  try {
    // Add default description if not provided
    const descToUse = description || "Added from Asset form";
    
    // Use the newly created asset-types endpoint
    const response = await axios.post(`${API_BASE_URL}/asset-types`, { 
      name, 
      description: descToUse 
    }, {
      headers: getHeaders(true)
    });
    
    if (response.status === 200 || response.status === 201) {
      return response.data;
    } else {
      throw new Error(`Failed to create asset type: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to create asset type:', error);
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
 * Create a new asset with proper authentication
 */
export const createAsset = async (assetData: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/assets`, assetData, {
      headers: getHeaders(true)
    });
    
    if (response.status === 200 || response.status === 201) {
      return response.data;
    } else {
      throw new Error(`Failed to create asset: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to create asset:', error);
    throw error;
  }
};

/**
 * Get all assignments with their details
 */
export const getAssignments = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/assignments`, {
      headers: getHeaders(true)
    });
    
    if (response.status === 200) {
      return response.data as any[];
    } else {
      throw new Error(`Failed to fetch assignments: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    return []; // Return empty array as fallback
  }
};

/**
 * Create a new assignment with proper authentication
 */
export const createAssignment = async (assignmentData: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/assignments`, assignmentData, {
      headers: getHeaders(true)
    });
    
    if (response.status === 200 || response.status === 201) {
      return response.data;
    } else {
      throw new Error(`Failed to create assignment: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to create assignment:', error);
    throw error;
  }
};

// Duplicate getAssets function removed

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