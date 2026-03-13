import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { DatabaseModule } from 'src/database/database.module';
import { IdentityModule } from 'src/identity/identity.module';
import { HrSettingsModule } from 'src/core/hr-settings/hr-settings.module';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    HrSettingsModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET as string,
        signOptions: {
          expiresIn: (process.env.JWT_ACCESS_TTL || '1h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, GoogleStrategy, MicrosoftStrategy],
  exports: [AuthService],
})
export class AuthModule { }
