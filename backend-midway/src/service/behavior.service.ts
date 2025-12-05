import { Provide, Inject } from '@midwayjs/core';
import { InfluxDBService } from './influxdb.service';
import { CacheService } from './cache.service';

@Provide()
export class BehaviorService {
  @Inject()
  influxDBService: InfluxDBService;

  @Inject()
  cacheService: CacheService;

  /**
   * 上报用户行为
   */
  async report(data: {
    projectId: string;
    type: string;
    url: string;
    path?: string;
    userId?: string;
    sessionId?: string;
    data?: any; // 详细数据
  }): Promise<void> {
    await this.influxDBService.writeBehavior(data);

    // 如果是 PV，更新实时计数
    if (data.type === 'pv') {
      await this.cacheService.incrTodayPV(data.projectId);
      if (data.sessionId) {
        await this.cacheService.addTodayUV(data.projectId, data.sessionId);
      }
    }

    // 清除统计缓存
    await this.cacheService.del(`behavior:stats:${data.projectId}`);
    await this.cacheService.del(`dashboard:${data.projectId}`);
  }

  /**
   * 获取行为统计
   */
  async getStats(projectId: string, type?: string): Promise<any> {
    // 尝试从缓存获取（如果指定了类型，不使用缓存）
    if (!type) {
      const cached = await this.cacheService.getBehaviorStats(projectId);
      if (cached) {
        return cached;
      }
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endTime = now.toISOString();

    // 如果指定了类型，只统计该类型；否则统计所有类型
    const behaviorType = type || 'pv';

    // 获取总体统计
    const stats = await this.influxDBService.queryBehaviorStats(projectId, startTime, endTime, behaviorType);

    // 获取时间趋势
    const trend = await this.influxDBService.queryBehaviorTrend(projectId, 7, behaviorType);
    const timeStats: Record<string, { count: number; uv: number }> = {};
    trend.forEach((item: any) => {
      // item.time 已经是日期字符串格式（YYYY-MM-DD）
      const date = typeof item.time === 'string' ? item.time : new Date(item.time).toISOString().split('T')[0];
      timeStats[date] = {
        count: item.count || 0,
        uv: item.uv || 0,
      };
    });

    // 获取热门页面/事件
    const topItemsResult = await this.influxDBService.queryTopBehaviorItems(projectId, 10, behaviorType);
    const topItems = topItemsResult.map((item: any) => ({
      url: item.url || 'unknown',
      userId: item.userId || 'anonymous',
      event: item.event || behaviorType,
      count: item.count || 0,
    }));

    // 构建返回结果
    const result: any = {
      type: behaviorType,
      total: stats.count || 0,
      uv: stats.uv || 0,
      timeStats,
      topItems,
    };

    // 为了向后兼容，当没有指定类型时，也返回 pv 字段
    if (!type) {
      result.pv = result.total;
      result.topPages = result.topItems;
      // 缓存结果（保持旧格式）
      await this.cacheService.setBehaviorStats(projectId, {
        pv: result.pv,
        uv: result.uv,
        timeStats: result.timeStats,
        topPages: result.topPages,
      });
    }

    return result;
  }

  /**
   * 获取行为事件详情列表（用于点击事件和自定义事件）
   */
  async getEvents(
    projectId: string,
    type?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<any> {
    // 只查询 click 和 custom 类型的事件
    const eventType = type || 'click';
    if (eventType !== 'click' && eventType !== 'custom') {
      return { list: [], total: 0, page, pageSize };
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 最近30天
    const endTime = now.toISOString();

    const events = await this.influxDBService.queryBehaviorEvents(
      projectId,
      eventType,
      startTime,
      endTime,
      page,
      pageSize
    );

    const total = await this.influxDBService.queryBehaviorEventsCount(
      projectId,
      eventType,
      startTime,
      endTime
    );

    return {
      list: events,
      total,
      page,
      pageSize,
    };
  }
}

