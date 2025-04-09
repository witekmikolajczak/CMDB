// apps/api/src/auth/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, SetMetadata } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { JWT_SECRET } from './auth.constants';

// Define metadata keys
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

// Create decorators
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    // Check if the endpoint is public
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) {
      return true;
    }
    
    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Verify the token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: JWT_SECRET
      });
      
      // Add user information to request
      request.user = payload;
      
      // Check roles if required
      const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
      if (requiredRoles && requiredRoles.length > 0) {
        if (!request.user.role || !requiredRoles.includes(request.user.role)) {
          throw new UnauthorizedException('Insufficient permissions');
        }
      }
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}