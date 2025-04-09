// apps/api/src/departments/departments.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus, Request } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Public, Roles } from '../auth/auth.guard';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Public() // Make this endpoint public for registration
  @Get()
  async getAllDepartments() {
    try {
      return await this.departmentsService.findAll();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch departments',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public() // Make this endpoint public for dashboard
  @Get('count')
  async getDepartmentsCount() {
    try {
      return await this.departmentsService.getDepartmentsCount();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch departments count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getDepartmentById(@Param('id') id: string) {
    try {
      const department = await this.departmentsService.findById(id);
      if (!department) {
        throw new HttpException('Department not found', HttpStatus.NOT_FOUND);
      }
      return department;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch department',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Roles('admin')
  @Post()
  async createDepartment(@Body() departmentData: { name: string; description: string; parentId?: string }) {
    try {
      const { name, description, parentId } = departmentData;
      const id = await this.departmentsService.create(name, description, parentId || null);
      return { id, message: 'Department created successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create department',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Roles('admin')
  @Put(':id')
  async updateDepartment(
    @Param('id') id: string,
    @Body() departmentData: { name: string; description: string; parentId?: string }
  ) {
    try {
      const { name, description, parentId } = departmentData;
      await this.departmentsService.update(id, name, description, parentId || null);
      return { message: 'Department updated successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update department',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Roles('admin')
  @Delete(':id')
  async deleteDepartment(@Param('id') id: string) {
    try {
      await this.departmentsService.delete(id);
      return { message: 'Department deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete department',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}