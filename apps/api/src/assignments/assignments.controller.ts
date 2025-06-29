// apps/api/src/assignments/assignments.controller.ts
import { Controller, Get, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Public, JwtAuthGuard } from '../auth/auth.guard';

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
  
  // Get all asset assignments
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllAssignments() {
    try {
      return await this.assignmentsService.getAllAssignments();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch assignments',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  // Create a new assignment
  @UseGuards(JwtAuthGuard)
  @Post()
  async createAssignment(@Body() assignmentData: any) {
    try {
      return await this.assignmentsService.createAssignment(assignmentData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create assignment',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
