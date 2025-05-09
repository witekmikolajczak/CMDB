import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the total count of active assignments
   */
  async getActiveAssignmentsCount(): Promise<{ count: number }> {
    try {
      // Using Prisma to count active assignments
      const count = await this.prisma.assetAssignment.count({
        where: {
          status: 'active',
        },
      });

      return { count };
    } catch (error) {
      this.logger.error(`Failed to fetch active assignments count: ${error}`);
      throw error;
    }
  }

  /**
   * Get the count of assignments created this week
   */
  async getAssignmentsCountThisWeek(): Promise<{ count: number }> {
    try {
      // Calculate the date one week ago
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Using Prisma to count assignments created in the last week
      const count = await this.prisma.assetAssignment.count({
        where: {
          assignmentDate: {
            gte: oneWeekAgo,
          },
        },
      });

      return { count };
    } catch (error) {
      this.logger.error(
        `Failed to fetch assignments count for this week: ${error}`,
      );
      throw error;
    }
  }
}
