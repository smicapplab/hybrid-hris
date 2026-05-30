import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseKeepAliveService } from './database-keep-alive.service';

@Module({
  providers: [DatabaseService, DatabaseKeepAliveService],
  exports: [DatabaseService],
})
export class DatabaseModule { }