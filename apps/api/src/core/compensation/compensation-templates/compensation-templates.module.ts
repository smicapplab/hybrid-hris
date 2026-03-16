import { Module } from '@nestjs/common';
import { CompensationTemplatesService } from './compensation-templates.service';
import { CompensationTemplatesController } from './compensation-templates.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
    imports: [DatabaseModule, AuditModule],
    providers: [CompensationTemplatesService],
    controllers: [CompensationTemplatesController],
    exports: [CompensationTemplatesService],
})
export class CompensationTemplatesModule { }
