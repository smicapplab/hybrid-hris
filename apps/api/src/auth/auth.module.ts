import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { DatabaseModule } from 'src/database/database.module';
import { IdentityModule } from 'src/identity/identity.module';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET as string,
        signOptions: {
          expiresIn: process.env.JWT_ACCESS_TTL as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy],
  exports: [AuthService],
})
export class AuthModule { }
