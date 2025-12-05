import { Controller, Get } from '@midwayjs/core';
import { formatDateTime } from '../utils/date.util';

@Controller('/')
export class HealthController {
  @Get('/health')
  async health() {
    return {
      status: 'ok',
      timestamp: formatDateTime(new Date()),
      service: 'monitor-backend',
    };
  }
}

