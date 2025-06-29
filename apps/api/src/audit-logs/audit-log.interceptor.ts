// apps/api/src/audit-logs/audit-log.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService, AuditAction } from './audit-logs.service';
import { Request, Response } from 'express';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
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
      case 'GET':
        action = AuditAction.READ;
        break;
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
        action = request.path.includes('login') ? AuditAction.LOGIN : AuditAction.SYSTEM_EVENT;
    }
    
    // Determine entity type from the request path
    const pathParts = request.path.split('/').filter(Boolean);
    const entityType = pathParts.length > 0 ? pathParts[0] : 'unknown';
    
    // Determine entity ID if available
    const entityId = pathParts.length > 1 ? pathParts[1] : undefined;
    
    // Store the original request body for comparison
    const originalBody = { ...request.body };
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          // Log successful requests
          this.auditLogsService.log({
            action,
            entityType,
            entityId,
            userId,
            username,
            previousValue: action === AuditAction.UPDATE ? originalBody : undefined,
            currentValue: action === AuditAction.CREATE || action === AuditAction.UPDATE ? data : undefined,
            additionalInfo: {
              method: request.method,
              path: request.path,
              statusCode: response.statusCode,
              duration: Date.now() - now,
            }
          }, request);
        },
        error: (error) => {
          // Log failed requests
          this.auditLogsService.log({
            action,
            entityType,
            entityId,
            userId,
            username,
            additionalInfo: {
              method: request.method,
              path: request.path,
              statusCode: error.status || 500,
              error: error.message,
              duration: Date.now() - now,
            }
          }, request);
        }
      })
    );
  }
}
