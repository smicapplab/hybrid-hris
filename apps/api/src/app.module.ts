import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './identity/users/users.module';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './identity/roles/roles.module';
import { IdentityModule } from './identity/identity.module';

@Module({
  imports: [AuthModule, UsersModule, DatabaseModule, RolesModule, IdentityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
