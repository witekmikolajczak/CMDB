import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly prisma: PrismaService) {}
  /**
   * Find all departments
   */
  async findAll() {
    try {
      // Using Prisma to fetch all departments
      const departments = await this.prisma.department.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          parentId: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return departments;
    } catch (error) {
      this.logger.error(`Failed to fetch departments: ${error}`);
      throw error;
    }
  }

  /**
   * Get the total count of departments
   */
  async getDepartmentsCount(): Promise<{ count: number }> {
    try {
      // Using Prisma to count departments
      const count = await this.prisma.department.count();

      return { count };
    } catch (error) {
      this.logger.error(`Failed to fetch departments count: ${error}`);
      throw error;
    }
  }

  /**
   * Find department by ID
   */
  async findById(id: number) {
    try {
      // Using Prisma to find department by ID
      const department = await this.prisma.department.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          parentId: true,
        },
      });

      return department;
    } catch (error) {
      this.logger.error(`Failed to fetch department ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new department
   */
  async create(name: string, description: string, parentId: number | null) {
    try {
      // Using Prisma to create a new department
      const department = await this.prisma.department.create({
        data: {
          name,
          description,
          parentId,
        },
        select: {
          id: true,
        },
      });

      return department.id;
    } catch (error) {
      this.logger.error(`Failed to create department: ${error}`);
      throw error;
    }
  }

  /**
   * Update an existing department
   */
  async update(
    id: number,
    name: string,
    description: string,
    parentId: number | null,
  ): Promise<boolean> {
    try {
      // Using Prisma to update department
      await this.prisma.department.update({
        where: { id },
        data: {
          name,
          description,
          parentId,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to update department ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a department
   */
  async delete(id: number): Promise<boolean> {
    try {
      // Using Prisma to delete department
      await this.prisma.department.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete department ${id}: ${error}`);
      throw error;
    }
  }
}
