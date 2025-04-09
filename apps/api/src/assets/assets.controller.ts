// apps/api/src/assets/assets.controller.ts
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { Public } from '../auth/auth.guard';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Public() // Make this endpoint public for dashboard
  @Get('count')
  async getAssetsCount() {
    try {
      return await this.assetsService.getAssetsCount();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch assets count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public() // Make this endpoint public for dashboard
  @Get('countMonth')
  async getAssetsCountThisMonth() {
    try {
      return await this.assetsService.getAssetsCountThisMonth();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch monthly assets count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
