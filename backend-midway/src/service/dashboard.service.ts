import { Provide, Inject } from '@midwayjs/core';
import { ErrorService } from './error.service';
import { PerformanceService } from './performance.service';
import { BehaviorService } from './behavior.service';
import { ApiMonitorService } from './api-monitor.service';
import { CacheService } from './cache.service';

@Provide()
export class DashboardService {
  @Inject()
  errorService: ErrorService;

  @Inject()
  performanceService: PerformanceService;

  @Inject()
  behaviorService: BehaviorService;

  @Inject()
  apiMonitorService: ApiMonitorService;

  @Inject()
  cacheService: CacheService;

  /**
   * 获取 Dashboard 概览数据
   */
  async getOverview(projectId: string): Promise<any> {
    // 尝试从缓存获取
    const cached = await this.cacheService.getDashboard(projectId);
    if (cached) {
      return cached;
    }

    try {
      // 并行获取各模块数据
      const [
        errorStats,
        performanceStats,
        behaviorStats,
        apiStats,
        todayErrorCount,
        todayPV,
        todayUV,
      ] = await Promise.all([
        this.errorService.getStats(projectId).catch(() => ({ total: 0, typeStats: {}, timeStats: {} })),
        this.performanceService.getStats(projectId).catch(() => ({ avgLoadTime: 0, avgFCP: 0, avgLCP: 0 })),
        this.behaviorService.getStats(projectId).catch(() => ({ pv: 0, uv: 0 })),
        this.apiMonitorService.getStats(projectId).catch(() => ({ successRate: 0, total: 0, success: 0, error: 0, avgResponseTime: 0, timeStats: {}, topApis: [] })),
        this.cacheService.getTodayErrorCount(projectId).catch(() => 0),
        this.cacheService.getTodayPV(projectId).catch(() => 0),
        this.cacheService.getTodayUV(projectId).catch(() => 0),
      ]);

      // 计算昨日错误数（从时间趋势中获取）
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];
      const yesterdayErrors = errorStats.timeStats?.[yesterdayKey] || 0;

      // 计算错误趋势
      const errorTrend = yesterdayErrors > 0
        ? (((todayErrorCount - yesterdayErrors) / yesterdayErrors) * 100).toFixed(1)
        : '0';

      // 获取今日错误类型统计（只统计js和promise）
      const todayTypeStats = await this.errorService.getTodayTypeStats(projectId);
      
      // 调试日志
      console.log('Dashboard overview - error type stats:', {
        projectId,
        todayErrorCount,
        todayTypeStats,
        errorStatsTypeStats: errorStats.typeStats
      });

      const overview = {
        errors: {
          today: todayErrorCount,
          yesterday: yesterdayErrors,
          last7Days: errorStats.total || 0,
          trend: parseFloat(errorTrend),
          typeStats: todayTypeStats, // 今日错误类型统计
        },
        performance: {
          avgLoadTime: performanceStats.avgLoadTime || 0,
          avgFCP: performanceStats.avgFCP || 0,
          avgLCP: performanceStats.avgLCP || 0,
        },
        behavior: {
          todayPV,
          todayUV,
          totalPV: behaviorStats.pv || 0,
          totalUV: behaviorStats.uv || 0,
        },
        api: {
          successRate: apiStats.total > 0 ? (apiStats.successRate || 0) : 0,
          total: apiStats.total || 0,
          avgResponseTime: apiStats.avgResponseTime || 0,
        },
      };

      // 缓存结果
      await this.cacheService.setDashboard(projectId, overview);

      return overview;
    } catch (error) {
      console.warn('Dashboard overview failed:', error.message);
      return {
        errors: { today: 0, yesterday: 0, last7Days: 0, trend: 0 },
        performance: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 },
        behavior: { todayPV: 0, todayUV: 0, totalPV: 0, totalUV: 0 },
        api: { successRate: 0, total: 0, avgResponseTime: 0 },
      };
    }
  }
}

