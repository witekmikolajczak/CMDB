// apps/api/src/assignments/assignments.controller.ts
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Public } from '../auth/auth.guard';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Public() // Make this endpoint public for dashboard
  @Get('count')
  async getActiveAssignmentsCount() {
    try {
      return await this.assignmentsService.getActiveAssignmentsCount();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch active assignments count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public() // Make this endpoint public for dashboard
  @Get('countWeek')
  async getAssignmentsCountThisWeek() {
    try {
      return await this.assignmentsService.getAssignmentsCountThisWeek();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch weekly assignments count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
