import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { DatabaseModule } from '../database/database.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DatabaseModule, PrismaModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
