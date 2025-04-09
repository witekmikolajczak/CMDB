// apps/api/src/database/database-config.service.ts
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

export interface DatabaseConfig {
  hostname: string;
  port: number;
  database: string;
  username: string;
  password: string;
  isConfigured: boolean;
}

@Injectable()
export class DatabaseConfigService {
  private readonly logger = new Logger(DatabaseConfigService.name);
  private readonly configPath = path.join(process.cwd(), 'db-config.json');
  // Simple encryption key - in production, you'd want this in an environment variable
  private readonly encryptionKey = 'inventrack-db-encryption-key-2025!';
  private readonly algorithm = 'aes-256-cbc';

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    try {
      if (!text || typeof text !== 'string') {
        return '';
      }
      
      // Create an initialization vector
      const iv = crypto.randomBytes(16);
      // Create cipher with fixed key length of 32 bytes
      const key = Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32));
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data as a single string
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error(`Encryption error: ${error.message}`);
      return '';
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    try {
      if (!encryptedText || typeof encryptedText !== 'string') {
        return '';
      }
      
      // Split IV and encrypted data
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        this.logger.warn('Invalid encrypted format');
        return ''; // Invalid format
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      // Create decipher with fixed key length of 32 bytes
      const key = Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32));
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption error: ${error.message}`);
      return ''; // Return empty string on error
    }
  }

  /**
   * Save database configuration to a file
   */
  saveConfig(config: DatabaseConfig): void {
    try {
      // Create a copy to avoid modifying the original
      const configToSave = { ...config };
      
      // Ensure password is a string before encryption
      if (configToSave.password && typeof configToSave.password === 'string') {
        configToSave.password = this.encrypt(configToSave.password);
      } else {
        // Handle case where password might not be a string
        configToSave.password = '';
        this.logger.warn('Password is not a string during save configuration');
      }
      
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(configToSave, null, 2),
        'utf8'
      );
      
      this.logger.log('Database configuration saved successfully');
    } catch (error) {
      this.logger.error(`Failed to save database config: ${error.message}`);
    }
  }

  /**
   * Get database configuration from file
   */
  getConfig(): DatabaseConfig | null {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const configStr = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configStr) as DatabaseConfig;
      
      // Ensure password is decrypted and is a string
      if (config.password) {
        const decryptedPassword = this.decrypt(config.password);
        config.password = decryptedPassword || '';
        
        // Validate password is a string
        if (typeof config.password !== 'string') {
          this.logger.warn('Decrypted password is not a string');
          config.password = String(config.password); // Convert to string if possible
        }
      } else {
        config.password = '';
      }
      
      return config;
    } catch (error) {
      this.logger.error(`Failed to read database config: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if database is configured
   */
  isDatabaseConfigured(): boolean {
    const config = this.getConfig();
    return !!config?.isConfigured;
  }

  /**
   * Clear configuration
   */
  clearConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        fs.unlinkSync(this.configPath);
        this.logger.log('Database configuration cleared');
      }
    } catch (error) {
      this.logger.error(`Failed to clear database config: ${error.message}`);
    }
  }
}