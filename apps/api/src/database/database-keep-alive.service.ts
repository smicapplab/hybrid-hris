import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DatabaseService } from './database.service';
import { sql } from 'drizzle-orm';

@Injectable()
export class DatabaseKeepAliveService {
  private readonly logger = new Logger(DatabaseKeepAliveService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.initializeKeepAlive();
  }

  private initializeKeepAlive() {
    const isEnabled = process.env.DB_KEEPALIVE_ENABLED === 'true';
    if (!isEnabled) {
      this.logger.log('Database keep-alive ping is disabled.');
      return;
    }

    const cronTime = process.env.DB_KEEPALIVE_CRON || '0 0 */3 * * *'; // default: every 3 days
    
    try {
      const job = new CronJob(cronTime, async () => {
        await this.pingDatabase();
      });

      this.schedulerRegistry.addCronJob('db-keep-alive', job);
      job.start();
      
      this.logger.log(`Database keep-alive ping scheduled with cron: "${cronTime}"`);
    } catch (error) {
      this.logger.error('Failed to schedule database keep-alive ping job:', error);
    }
  }

  private async pingDatabase() {
    this.logger.log('Sending keep-alive ping to database...');
    const startTime = Date.now();
    
    try {
      await this.db.db.execute(sql`SELECT 1`);
      const duration = Date.now() - startTime;
      this.logger.log(`Keep-alive ping successful! Response time: ${duration}ms`);
    } catch (error) {
      this.logger.error('Database keep-alive ping failed:', error);
    }
  }
}
