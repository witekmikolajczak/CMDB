import { Controller, Get } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Public } from '../auth/auth.guard';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Public()
  @Get('count')
  async getActiveAssignmentsCount() {
    return await this.assignmentsService.getActiveAssignmentsCount();
  }

  @Public()
  @Get('countWeek')
  async getAssignmentsCountThisWeek() {
    return await this.assignmentsService.getAssignmentsCountThisWeek();
  }
}
