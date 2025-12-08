import { Controller, Get, Inject, Config } from '@midwayjs/core';
import { ApiTags, ApiOperation } from '@midwayjs/swagger';
import { DashboardService } from '../service/dashboard.service';

@Controller('/dashboard')
@ApiTags(['dashboard'])
export class DashboardController {
  @Inject()
  dashboardService: DashboardService;

  @Config('defaultProjectId')
  defaultProjectId: string;

  @Get('/overview')
  @ApiOperation({ summary: '获取仪表盘概览数据' })
  async overview() {
    const data = await this.dashboardService.getOverview(this.defaultProjectId);
    return { success: true, data };
  }
}

