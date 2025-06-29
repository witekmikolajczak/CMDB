// apps/api/src/audit-logs/event-logger.service.ts
import { Injectable } from '@nestjs/common';
import { AuditLogsService, AuditAction } from './audit-logs.service';
import { Request } from 'express';

/**
 * Service for logging specific events that aren't automatically captured by interceptors
 * This can be injected into any service or controller that needs to log specific events
 */
@Injectable()
export class EventLoggerService {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * Log a system event
   * @param action The action being performed
   * @param entityType The type of entity involved
   * @param entityId Optional ID of the entity
   * @param details Additional details about the event
   * @param userId Optional user ID associated with the event
   * @param username Optional username associated with the event
   * @param request Optional Express request object for IP and hostname info
   */
  logSystemEvent(
    action: AuditAction,
    entityType: string,
    entityId?: string,
    details?: any,
    userId?: string | number,
    username?: string,
    request?: Request
  ) {
    return this.auditLogsService.log({
      action,
      entityType,
      entityId,
      userId,
      username,
      additionalInfo: details
    }, request);
  }

  /**
   * Log a configuration change
   * @param entityType The type of configuration being changed
   * @param previousValue Previous configuration value
   * @param currentValue New configuration value
   * @param userId User ID making the change
   * @param username Username making the change
   * @param request Express request object for IP and hostname info
   */
  logConfigChange(
    entityType: string,
    previousValue: any,
    currentValue: any,
    userId: string | number,
    username: string,
    request?: Request
  ) {
    return this.auditLogsService.log({
      action: AuditAction.CONFIG_CHANGE,
      entityType,
      userId,
      username,
      previousValue,
      currentValue
    }, request);
  }

  /**
   * Log a security event (e.g., permission changes, role assignments)
   * @param action The security action being performed
   * @param entityType The type of entity involved
   * @param entityId ID of the entity
   * @param details Additional details about the security event
   * @param userId User ID performing the action
   * @param username Username performing the action
   * @param request Express request object for IP and hostname info
   */
  logSecurityEvent(
    action: AuditAction,
    entityType: string,
    entityId: string,
    details: any,
    userId: string | number,
    username: string,
    request?: Request
  ) {
    return this.auditLogsService.log({
      action,
      entityType,
      entityId,
      userId,
      username,
      additionalInfo: {
        securityEvent: true,
        ...details
      }
    }, request);
  }

  /**
   * Log an error event
   * @param entityType The type of entity where the error occurred
   * @param entityId Optional ID of the entity where the error occurred
   * @param error The error object or message
   * @param userId Optional user ID associated with the error
   * @param username Optional username associated with the error
   * @param request Express request object for IP and hostname info
   */
  logError(
    entityType: string,
    error: any,
    entityId?: string,
    userId?: string | number,
    username?: string,
    request?: Request
  ) {
    return this.auditLogsService.log({
      action: AuditAction.ERROR,
      entityType,
      entityId,
      userId,
      username,
      additionalInfo: {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      }
    }, request);
  }

  /**
   * Log a data import/export event
   * @param action The action being performed (IMPORT or EXPORT)
   * @param entityType The type of data being imported/exported
   * @param details Details about the import/export
   * @param userId User ID performing the action
   * @param username Username performing the action
   * @param request Express request object for IP and hostname info
   */
  logDataTransfer(
    action: AuditAction,
    entityType: string,
    details: any,
    userId: string | number,
    username: string,
    request?: Request
  ) {
    return this.auditLogsService.log({
      action,
      entityType,
      userId,
      username,
      additionalInfo: details
    }, request);
  }
}
