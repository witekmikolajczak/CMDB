// apps/api/src/audit-logs/audit-logs.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

// Note: You'll need to implement proper authentication guards
// This is a placeholder that you should replace with your actual auth guard
class AuthGuard {}

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  // @UseGuards(AuthGuard) // Uncomment and implement proper auth guard
  async getAuditLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('username') username?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filters: any = {};
    
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (userId) filters.userId = parseInt(userId);
    if (username) filters.username = username;
    if (fromDate) filters.fromDate = new Date(fromDate);
    if (toDate) filters.toDate = new Date(toDate);

    return this.auditLogsService.getAuditLogs(
      parseInt(page), 
      parseInt(limit),
      filters
    );
  }
}
