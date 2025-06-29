// apps/api/src/assets/assets.controller.ts
import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { Public, JwtAuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

// Define interface to extend Express Request with user property
interface RequestWithUser extends Request {
  user?: any;
}

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

  // Create a new asset
  @UseGuards(JwtAuthGuard)
  @Post()
  async createAsset(@Body() assetData: any, @Req() request: RequestWithUser) {
    try {
      // Get the user ID from the authenticated request
      const userId = request.user?.['sub'];
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      // Add the created_by field to the asset data
      const assetWithCreator = {
        ...assetData,
        created_by: userId
      };

      return await this.assetsService.createAsset(assetWithCreator);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create asset',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  // Get all assets
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllAssets() {
    try {
      return await this.assetsService.getAllAssets();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch assets',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
