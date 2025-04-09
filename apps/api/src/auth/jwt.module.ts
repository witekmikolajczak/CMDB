// apps/api/src/auth/jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    NestJwtModule.register({
      secret: process.env.JWT_SECRET || 'inventrack-secret-key-2025',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  exports: [NestJwtModule],
})
export class JwtModule {}
