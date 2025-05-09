import { Controller, Get } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { Public } from '../auth/auth.guard';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Public()
  @Get('count')
  async getAssetsCount() {
    return await this.assetsService.getAssetsCount();
  }

  @Public()
  @Get('countMonth')
  async getAssetsCountThisMonth() {
    return await this.assetsService.getAssetsCountThisMonth();
  }
}
