// apps/api/src/asset-types/asset-types.controller.ts
import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { AssetTypesService } from './asset-types.service';
import { Public, JwtAuthGuard, Roles } from '../auth/auth.guard';

@Controller('asset-types')
export class AssetTypesController {
  constructor(private readonly assetTypesService: AssetTypesService) {}

  @Public() // Make this endpoint public for asset forms
  @Get()
  async getAllAssetTypes() {
    try {
      return await this.assetTypesService.findAll();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch asset types',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public() // Make this endpoint public for dashboard
  @Get('count')
  async getAssetTypesCount() {
    try {
      return await this.assetTypesService.getAssetTypesCount();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch asset types count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getAssetTypeById(@Param('id') id: string) {
    try {
      return await this.assetTypesService.findById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch asset type',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  async createAssetType(@Body() assetTypeData: { name: string; description: string; categoryId?: number }) {
    try {
      const { name, description, categoryId } = assetTypeData;
      return await this.assetTypesService.create(name, description, categoryId || 1);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create asset type',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
