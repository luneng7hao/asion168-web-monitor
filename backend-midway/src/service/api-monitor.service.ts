import { Provide, Inject } from '@midwayjs/core';
import { InfluxDBService } from './influxdb.service';
import { CacheService } from './cache.service';

@Provide()
export class ApiMonitorService {
  @Inject()
  influxDBService: InfluxDBService;

  @Inject()
  cacheService: CacheService;

  /**
   * 上报接口监控数据
   */
  async report(data: {
    projectId: string;
    url: string;
    method: string;
    status: number;
    responseTime: number;
    userId?: string;
    sessionId?: string;
    requestData?: any;
    responseData?: any;
  }): Promise<void> {
    await this.influxDBService.writeApiMonitor(data);

    // 清除统计缓存
    await this.cacheService.del(`api:stats:${data.projectId}`);
    await this.cacheService.del(`dashboard:${data.projectId}`);
  }

  /**
   * 获取接口统计
   */
  async getStats(projectId: string): Promise<any> {
    // 尝试从缓存获取
    const cached = await this.cacheService.getApiStats(projectId);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endTime = now.toISOString();

    // 获取总体统计
    const [overallStats] = await this.influxDBService.queryApiStats(projectId, startTime, endTime);

    const total = overallStats?.total || 0;
    const success = overallStats?.success || 0;
    const error = total - success;
    const successRate = total > 0 ? parseFloat(((success / total) * 100).toFixed(2)) : 0;

    // 获取时间趋势
    const trend = await this.influxDBService.queryApiTrend(projectId, 7);
    const timeStats: Record<string, { total: number; success: number; error: number; avgResponseTime: number }> = {};
    trend.forEach((item: any) => {
      // item.time 已经是日期字符串格式（YYYY-MM-DD）
      const date = typeof item.time === 'string' ? item.time : new Date(item.time).toISOString().split('T')[0];
      const itemTotal = item.total || 0;
      const itemSuccess = item.success || 0;
      timeStats[date] = {
        total: itemTotal,
        success: itemSuccess,
        error: itemTotal - itemSuccess,
        avgResponseTime: Math.round(item.avgResponseTime || 0),
      };
    });

    // 获取热门接口
    const topApisResult = await this.influxDBService.queryTopApis(projectId, 10);
    const topApis = topApisResult.map((item: any) => {
      const itemTotal = item.total || 0;
      const itemSuccess = item.success || 0;
      return {
        url: item.url || 'unknown',
        method: item.method || 'GET',
        userId: item.userId || 'anonymous',
        total: itemTotal,
        success: itemSuccess,
        error: itemTotal - itemSuccess,
        avgResponseTime: Math.round(item.avgResponseTime || 0),
      };
    });

    const stats = {
      total,
      success,
      error,
      successRate,
      avgResponseTime: Math.round(overallStats?.avgResponseTime || 0),
      timeStats,
      topApis,
    };

    // 缓存结果
    await this.cacheService.setApiStats(projectId, stats);

    return stats;
  }

  /**
   * 获取接口错误详情
   */
  async getErrorDetails(projectId: string, url: string, method: string = 'GET') {
    return await this.influxDBService.queryApiErrors(projectId, url, method, 20);
  }
}

