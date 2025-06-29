// apps/api/src/asset-types/asset-types.module.ts
import { Module } from '@nestjs/common';
import { AssetTypesController } from './asset-types.controller';
import { AssetTypesService } from './asset-types.service';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from '../auth/auth.constants';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AssetTypesController],
  providers: [AssetTypesService],
  exports: [AssetTypesService],
})
export class AssetTypesModule {}
