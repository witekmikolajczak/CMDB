// apps/api/src/departments/departments.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus, Request } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Public, Roles } from '../auth/auth.guard';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async getAllDepartments(@Request() req) {
    try {
      // Role-based access control:
      // 1. Admin: Access all departments
      // 2. Manager: Access only their departments
      // 3. Standard User: Access only their departments
      
      if (req.user.role === 'admin') {
        // Admin can see all departments
        return await this.departmentsService.findAll();
      } else {
        // Managers and standard users can only see their departments
        return await this.departmentsService.findByUserId(req.user.id);
      }
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
      // Check if department limit has been reached (max 10)
      const departmentCount = await this.departmentsService.getDepartmentsCount();
      if (departmentCount.count >= 10) {
        throw new HttpException('Maximum department limit reached (10)', HttpStatus.BAD_REQUEST);
      }
      
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

  @Put(':id')
  async updateDepartment(
    @Request() req,
    @Param('id') id: string,
    @Body() departmentData: { name: string; description: string; parentId?: string }
  ) {
    try {
      // Check if user has permission to update this department
      if (req.user.role === 'admin') {
        // Admin can update any department
        const { name, description, parentId } = departmentData;
        await this.departmentsService.update(id, name, description, parentId || null);
        return { message: 'Department updated successfully' };
      } else if (req.user.role === 'manager') {
        // Manager can only update their own departments
        const userDepartments = await this.departmentsService.findByUserId(req.user.id);
        const canEdit = userDepartments.some(dept => dept.id === id);
        
        if (!canEdit) {
          throw new HttpException('You do not have permission to update this department', HttpStatus.FORBIDDEN);
        }
        
        // Managers cannot change parent department
        const { name, description } = departmentData;
        await this.departmentsService.update(id, name, description, null);
        return { message: 'Department updated successfully' };
      } else {
        // Standard users cannot update departments
        throw new HttpException('You do not have permission to update departments', HttpStatus.FORBIDDEN);
      }
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
  
  @Roles('admin')
  @Post(':id/addUsers')
  async addUsersToDepartment(
    @Param('id') departmentId: string,
    @Body() data: { userIds: string[] }
  ) {
    try {
      const { userIds } = data;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new HttpException('Invalid user IDs provided', HttpStatus.BAD_REQUEST);
      }
      
      await this.departmentsService.addUsersToDepartment(departmentId, userIds);
      return { message: 'Users added to department successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add users to department',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('users/assigned')
  async getAssignedUsers() {
    try {
      const assignedUsers = await this.departmentsService.getAssignedUsers();
      return assignedUsers;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch assigned users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Get(':id/users')
  async getDepartmentUsers(@Param('id') id: string) {
    try {
      const users = await this.departmentsService.getDepartmentUsers(id);
      return users;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch department users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Roles('admin')
  @Delete(':id/removeUser/:userId')
  async removeUserFromDepartment(
    @Param('id') departmentId: string,
    @Param('userId') userId: string
  ) {
    try {
      await this.departmentsService.removeUserFromDepartment(departmentId, userId);
      return { message: 'User removed from department successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to remove user from department',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}