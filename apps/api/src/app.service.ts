import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
    getHealth() {
        return {
            status: 'ok',
            service: 'hybrid-hris-api',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        }
    }
}