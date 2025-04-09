// apps/api/src/core/core.module.ts
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../auth/auth.constants';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES_IN },
    }),
  ],
  exports: [JwtModule],
})
export class CoreModule {}
