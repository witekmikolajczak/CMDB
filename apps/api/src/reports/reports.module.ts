import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DatabaseModule } from 'src/database/database.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/auth/auth.constants';
import { DepartmentsService } from 'src/departments/departments.service';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  imports: [
    DatabaseModule,
    DepartmentsModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
