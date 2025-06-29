// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, Get, Headers } from '@nestjs/common';
import { AuthService, UserCredentials, RegisterUserDto } from './auth.service';
import { Public } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() credentials: UserCredentials) {
    try {
      return await this.authService.login(credentials);
    } catch (error) {
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public()
  @Post('register')
  async register(@Body() userData: RegisterUserDto) {
    try {
      return await this.authService.register(userData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  @Get('validate')
  async validateToken(@Headers('authorization') authHeader: string) {
    try {
      const token = authHeader?.split(' ')[1];
      if (!token) {
        return { valid: false, message: 'No token provided' };
      }
      
      const payload = await this.authService.validateToken(token);
      const user = await this.authService.getUserById(payload.sub);
      
      if (!user) {
        return { valid: false, message: 'User not found' };
      }
      
      return { valid: true, user: user };
    } catch (error) {
      throw new HttpException(
        error.message || 'Token validation failed',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }
}