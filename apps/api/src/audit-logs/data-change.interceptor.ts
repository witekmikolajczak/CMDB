// apps/api/src/audit-logs/data-change.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService, AuditAction } from './audit-logs.service';
import { Request, Response } from 'express';

/**
 * Interceptor specifically for tracking data changes
 * This interceptor is designed to be applied to specific routes that modify data
 * and require detailed tracking of previous and current values
 */
@Injectable()
export class DataChangeInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Extract user information from request if available
    // Use type assertion since Express.Request doesn't include user by default
    const user = (request as any).user;
    const userId = user?.id;
    const username = user?.username;
    
    // Determine the action based on HTTP method
    let action: AuditAction;
    switch (request.method) {
      case 'POST':
        action = AuditAction.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        action = AuditAction.UPDATE;
        break;
      case 'DELETE':
        action = AuditAction.DELETE;
        break;
      default:
        return next.handle(); // Skip logging for non-data-changing methods
    }
    
    // Extract entity information from request
    const pathParts = request.path.split('/').filter(Boolean);
    const entityType = pathParts.length > 0 ? pathParts[0] : 'unknown';
    const entityId = pathParts.length > 1 ? pathParts[1] : undefined;
    
    // Store the original request body for comparison
    const originalBody = { ...request.body };
    
    // For update operations, we need to fetch the current state of the entity
    // This would typically be done in the controller or service
    // Here we're just setting up the interceptor structure
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          // Log successful data changes
          this.auditLogsService.log({
            action,
            entityType,
            entityId,
            userId,
            username,
            previousValue: action === AuditAction.UPDATE || action === AuditAction.DELETE ? originalBody : undefined,
            currentValue: action === AuditAction.CREATE || action === AuditAction.UPDATE ? data : undefined,
            additionalInfo: {
              method: request.method,
              path: request.path,
              statusCode: response.statusCode,
            }
          }, request);
        },
        error: (error) => {
          // Log failed data change attempts
          this.auditLogsService.log({
            action,
            entityType,
            entityId,
            userId,
            username,
            previousValue: action === AuditAction.UPDATE ? originalBody : undefined,
            additionalInfo: {
              method: request.method,
              path: request.path,
              statusCode: error.status || 500,
              error: error.message,
            }
          }, request);
        }
      })
    );
  }
}
