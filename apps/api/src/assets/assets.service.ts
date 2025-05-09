import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the total count of assets
   */
  async getAssetsCount(): Promise<{ count: number }> {
    try {
      // Using Prisma to count all assets
      const count = await this.prisma.asset.count();
      return { count };
    } catch (error) {
      this.logger.error(`Failed to fetch assets count: ${error}`);
      throw error;
    }
  }

  /**
   * Get the count of assets added this month
   */
  async getAssetsCountThisMonth(): Promise<{ count: number }> {
    try {
      // Get the first day of the current month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      // Using Prisma to count assets created this month
      const count = await this.prisma.asset.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
      });
      return { count };
    } catch (error) {
      this.logger.error(
        `Failed to fetch assets count for this month: ${error}`,
      );
      throw error;
    }
  }
}
