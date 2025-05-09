import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Public, Roles } from '../auth/auth.guard';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Public() // Make this endpoint public for registration
  @Get()
  async getAllDepartments() {
    return await this.departmentsService.findAll();
  }

  @Public() // Make this endpoint public for dashboard
  @Get('count')
  async getDepartmentsCount() {
    return await this.departmentsService.getDepartmentsCount();
  }

  @Get(':id')
  async getDepartmentById(@Param('id') id: string) {
    const department = await this.departmentsService.findById(id);
    if (!department) {
      throw new HttpException('Department not found', HttpStatus.NOT_FOUND);
    }
    return department;
  }

  @Roles('admin')
  @Post()
  async createDepartment(
    @Body()
    departmentData: {
      name: string;
      description: string;
      parentId?: string;
    },
  ) {
    const { name, description, parentId } = departmentData;
    const id = await this.departmentsService.create(
      name,
      description,
      parentId || null,
    );
    return { id, message: 'Department created successfully' };
  }

  @Roles('admin')
  @Put(':id')
  async updateDepartment(
    @Param('id') id: string,
    @Body()
    departmentData: { name: string; description: string; parentId?: string },
  ) {
    const { name, description, parentId } = departmentData;
    await this.departmentsService.update(
      id,
      name,
      description,
      parentId || null,
    );
    return { message: 'Department updated successfully' };
  }

  @Roles('admin')
  @Delete(':id')
  async deleteDepartment(@Param('id') id: string) {
    await this.departmentsService.delete(id);
    return { message: 'Department deleted successfully' };
  }
}
