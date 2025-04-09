// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { compareSync, hashSync } from 'bcrypt';
import { PoolClient } from 'pg';

export interface UserCredentials {
  username: string;
  password: string;
}

export interface RegisterUserDto {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId?: number;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials and generate JWT token
   */
  async login(credentials: UserCredentials) {
    const { username, password } = credentials;
    
    // Get the database client
    if (!this.databaseService.getPool()) {
      throw new UnauthorizedException('Database not configured');
    }
    
    let client: PoolClient | null = null;
    
    try {
        client = await this.databaseService.getPool()!.connect();
      
      // Find the user
      const result = await client?.query(
        'SELECT u.id, u.username, u.password_hash, u.email, u.first_name, u.last_name, r.name as role, s.name as status FROM cmdb.users u LEFT JOIN cmdb.roles r ON u.role_id = r.id LEFT JOIN cmdb.user_statuses s ON u.status_id = s.id WHERE u.username = $1',
        [username]
      );
      
      const user = result?.rows[0];
      
      // Check if user exists and is active
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is not active');
      }
      
      // Verify password
      const isPasswordValid = compareSync(password, user.password_hash);
      
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Update last login time
      await client?.query(
        'UPDATE cmdb.users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      
      // Generate JWT token
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Register a new user (only available during setup or for admins)
   */
  async register(userData: RegisterUserDto) {
    // Get the database client
    if (!this.databaseService.getPool()) {
      throw new UnauthorizedException('Database not configured');
    }
    
    let client: PoolClient | null = null;
    
    try {
      client = await this.databaseService.getPool()!.connect();
      
      // Check if username or email already exists
      const checkResult = await client?.query(
        'SELECT COUNT(*) FROM cmdb.users WHERE username = $1 OR email = $2',
        [userData.username, userData.email]
      );
      
      if (parseInt(checkResult?.rows[0].count) > 0) {
        throw new Error('Username or email already exists');
      }
      
      // Hash the password
      const passwordHash = hashSync(userData.password, 10);
      
      // Insert the new user
      const result = await client?.query(
        `INSERT INTO cmdb.users (
          username, password_hash, email, first_name, last_name, 
          department_id, role_id, status_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING id, username, email, first_name, last_name, role_id`,
        [
          userData.username,
          passwordHash,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.departmentId || null,
          2, // 2 for standard_user role
          1, // 1 for active status
        ]
      );
      
      const newUser = result?.rows[0];
      
      // Generate JWT token
      const payload: JwtPayload = {
        sub: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: 'standard_user', // Default role
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: 'standard_user', // Default role
        },
      };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Validate JWT token and return user information
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}