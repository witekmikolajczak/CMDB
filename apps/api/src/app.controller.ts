// apps/api/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('status')
  getDatabaseStatus() {
    return this.appService.getDatabaseStatus();
  }
}