// apps/api/src/user-preferences/user-preferences.controller.ts
import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('user-preferences')
@UseGuards(JwtAuthGuard)
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get()
  async getAllPreferences(@Request() req) {
    const userId = req.user.sub;
    return this.userPreferencesService.getUserPreferences(userId);
  }

  @Get(':key')
  async getPreference(@Request() req, @Param('key') key: string) {
    const userId = req.user.sub;
    return this.userPreferencesService.getUserPreference(userId, key);
  }

  @Post(':key')
  async setPreference(
    @Request() req,
    @Param('key') key: string,
    @Body('value') value: string,
  ) {
    const userId = req.user.sub;
    return this.userPreferencesService.setUserPreference(userId, key, value);
  }

  @Post()
  async setPreferences(
    @Request() req,
    @Body() preferences: Record<string, string>,
  ) {
    const userId = req.user.sub;
    return this.userPreferencesService.setUserPreferences(userId, preferences);
  }

  @Delete(':key')
  async deletePreference(@Request() req, @Param('key') key: string) {
    const userId = req.user.sub;
    return this.userPreferencesService.deleteUserPreference(userId, key);
  }

  @Delete()
  async deleteAllPreferences(@Request() req) {
    const userId = req.user.sub;
    return this.userPreferencesService.deleteAllUserPreferences(userId);
  }
}
