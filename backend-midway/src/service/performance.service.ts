import { Provide, Inject } from '@midwayjs/core';
import { InfluxDBService } from './influxdb.service';
import { CacheService } from './cache.service';

@Provide()
export class PerformanceService {
  @Inject()
  influxDBService: InfluxDBService;

  @Inject()
  cacheService: CacheService;

  /**
   * 上报性能数据
   */
  async report(data: {
    projectId: string;
    url: string;
    userId?: string;
    sessionId?: string;
    loadTime: number;
    domReady?: number;
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    dns?: number;
    tcp?: number;
    ttfb?: number;
  }): Promise<void> {
    await this.influxDBService.writePerformance(data);

    // 清除统计缓存
    await this.cacheService.del(`performance:stats:${data.projectId}`);
    await this.cacheService.del(`dashboard:${data.projectId}`);
  }

  /**
   * 获取性能统计
   */
  async getStats(projectId: string): Promise<any> {
    // 尝试从缓存获取
    const cached = await this.cacheService.getPerformanceStats(projectId);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endTime = now.toISOString();

    // 获取总体统计
    const [overallStats] = await this.influxDBService.queryPerformanceStats(
      projectId,
      startTime,
      endTime
    );

    // 获取时间趋势
    const trend = await this.influxDBService.queryPerformanceTrend(projectId, 7);
    const timeStats: Record<string, { count: number; avgLoadTime: number }> = {};
    trend.forEach((item: any) => {
      const date = new Date(item.time).toISOString().split('T')[0];
      timeStats[date] = {
        count: item.count || 0,
        avgLoadTime: Math.round(item.avgLoadTime || 0),
      };
    });

    const stats = {
      avgLoadTime: Math.round(overallStats?.avgLoadTime || 0),
      avgFCP: Math.round(overallStats?.avgFcp || 0),
      avgLCP: Math.round(overallStats?.avgLcp || 0),
      avgFID: Math.round(overallStats?.avgFid || 0),
      avgCLS: (overallStats?.avgCls || 0).toFixed(4),
      timeStats,
    };

    // 缓存结果
    await this.cacheService.setPerformanceStats(projectId, stats);

    return stats;
  }

  /**
   * 获取性能列表（从 InfluxDB 查询最近的数据）
   */
  async getList(params: {
    projectId: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: any[]; total: number }> {
    // InfluxDB 不适合分页查询，这里返回最近的数据
    const { projectId, pageSize = 20 } = params;

    const query = `
      SELECT 
        time,
        "url",
        "userId",
        "loadTime",
        "fcp",
        "lcp",
        "fid",
        "cls"
      FROM "performance"
      WHERE "projectId" = '${projectId}'
      ORDER BY time DESC
      LIMIT ${pageSize}
    `;

    const data = await this.influxDBService['client'].query(query);

    return {
      data: data.map((item: any) => ({
        timestamp: item.time,
        url: item.url || 'unknown',
        userId: item.userId || 'anonymous',
        loadTime: item.loadTime || 0,
        fcp: item.fcp || 0,
        lcp: item.lcp || 0,
        fid: item.fid || 0,
        cls: item.cls || 0,
      })),
      total: data.length,
    };
  }
}

