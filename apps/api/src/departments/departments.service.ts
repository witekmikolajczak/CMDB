import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all departments
   */
  async findAll() {
    // Using Prisma to fetch all departments
    const departments = await this.prisma.department.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
      },
    });

    return departments;
  }

  /**
   * Get the total count of departments
   */
  async getDepartmentsCount(): Promise<{ count: number }> {
    // Using Prisma to count departments
    const count = await this.prisma.department.count();

    return { count };
  }

  /**
   * Find department by ID
   */
  async findById(id: string) {
    // Convert string ID to number for Prisma
    const numericId = parseInt(id, 10);

    // Using Prisma to find department by ID
    const department = await this.prisma.department.findUnique({
      where: { id: numericId },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
      },
    });

    return department;
  }

  /**
   * Create a new department
   */
  async create(name: string, description: string, parentId: string | null) {
    const numericParentId = parentId ? parseInt(parentId, 10) : null;

    // Using Prisma to create a new department
    const department = await this.prisma.department.create({
      data: {
        name,
        description,
        parentId: numericParentId,
      },
      select: {
        id: true,
      },
    });

    return department.id;
  }

  /**
   * Update an existing department
   */
  async update(
    id: string,
    name: string,
    description: string,
    parentId: string | null,
  ): Promise<boolean> {
    // Convert string ID to number for Prisma
    const numericId = parseInt(id, 10);

    // Convert parentId from string to number if it's not null
    const numericParentId = parentId ? parseInt(parentId, 10) : null;

    // Using Prisma to update department
    await this.prisma.department.update({
      where: { id: numericId },
      data: {
        name,
        description,
        parentId: numericParentId,
      },
    });

    return true;
  }

  /**
   * Delete a department
   */
  async delete(id: string): Promise<boolean> {
    // Convert string ID to number for Prisma
    const numericId = parseInt(id, 10);

    // Using Prisma to delete department
    await this.prisma.department.delete({
      where: { id: numericId },
    });

    return true;
  }
}
