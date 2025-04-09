export interface DatabaseConfig {
    hostname: string;
    port: number;
    database: string;
    username: string;
    password: string;
    isConfigured: boolean;
  }
  
  const DATABASE_CONFIG_KEY = 'database_config';
  
  /**
   * Service to store and retrieve database configuration
   */
  export const databaseConfigService = {
    /**
     * Save database configuration to localStorage
     */
    saveConfig(config: DatabaseConfig): void {
      // Remove password for security when setting isConfigured to false
      const configToSave = config.isConfigured 
        ? config 
        : { ...config, password: '' };
        
      localStorage.setItem(DATABASE_CONFIG_KEY, JSON.stringify(configToSave));
    },
  
    /**
     * Get database configuration from localStorage
     */
    getConfig(): DatabaseConfig | null {
      const configStr = localStorage.getItem(DATABASE_CONFIG_KEY);
      if (!configStr) return null;
      
      try {
        return JSON.parse(configStr) as DatabaseConfig;
      } catch (error) {
        console.error('Failed to parse database config:', error);
        return null;
      }
    },
  
    /**
     * Check if database is configured
     */
    isDatabaseConfigured(): boolean {
      const config = this.getConfig();
      return !!config?.isConfigured;
    },
  
    /**
     * Clear database configuration
     */
    clearConfig(): void {
      localStorage.removeItem(DATABASE_CONFIG_KEY);
    }
  };