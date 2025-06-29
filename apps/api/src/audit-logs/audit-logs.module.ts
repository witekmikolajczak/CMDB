// apps/api/src/audit-logs/audit-logs.module.ts
import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { EventLoggerService } from './event-logger.service';
import { DataChangeInterceptor } from './data-change.interceptor';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditLogsController],
  providers: [
    AuditLogsService,
    EventLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    DataChangeInterceptor,
  ],
  exports: [AuditLogsService, EventLoggerService, DataChangeInterceptor],
})
export class AuditLogsModule {}
