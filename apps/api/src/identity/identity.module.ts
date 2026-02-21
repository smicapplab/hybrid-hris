import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';

@Module({
    imports: [UsersModule, RolesModule],
    exports: [UsersModule, RolesModule],
})
export class IdentityModule { }
