import { Provide, Inject, Init, Destroy } from '@midwayjs/core';
import { InfluxDBService } from './influxdb.service';
import { CacheService } from './cache.service';
import { ErrorService } from './error.service';
import { ElasticsearchService } from './elasticsearch.service';
import { Config } from '@midwayjs/core';
import mongoose from 'mongoose';

@Provide()
export class DataCleanupService {
  @Inject()
  influxDBService: InfluxDBService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  errorService: ErrorService;

  @Inject()
  elasticsearchService: ElasticsearchService;

  @Config('defaultProjectId')
  defaultProjectId: string;

  private cleanupTimer: NodeJS.Timeout | null = null;

  @Init()
  async init() {
    // 启动定时清理任务，每天凌晨2点执行
    this.startScheduledCleanup();
  }

  @Destroy()
  async destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 启动定时清理任务
   * 每天凌晨2点执行一次
   */
  private startScheduledCleanup() {
    // 计算到下一个凌晨2点的时间
    const now = new Date();
    const nextCleanup = new Date();
    nextCleanup.setHours(2, 0, 0, 0);
    
    // 如果已经过了今天的2点，设置为明天的2点
    if (now >= nextCleanup) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    const msUntilNext = nextCleanup.getTime() - now.getTime();

    console.log(`📅 Scheduled data cleanup will run at: ${nextCleanup.toLocaleString()}`);

    // 等待到下一个2点
    setTimeout(() => {
      // 立即执行一次
      this.deleteOldData(this.defaultProjectId, 30);

      // 然后每24小时执行一次
      this.cleanupTimer = setInterval(() => {
        this.deleteOldData(this.defaultProjectId, 30);
      }, 24 * 60 * 60 * 1000);
    }, msUntilNext);
  }

  /**
   * 清除所有监控数据
   */
  async clearAllData(projectId: string): Promise<void> {
    // 1. 清除 MongoDB 中的错误数据
    if (this.errorService.errorModel) {
      await this.errorService.errorModel.deleteMany({ projectId });
    }

    // 2. 清除 InfluxDB 中的数据
    await this.influxDBService.clearAllData(projectId);

    // 3. 清除 Redis 中的缓存和计数
    await this.cacheService.clearAllCache(projectId);

    // 4. 清除 Elasticsearch 中的监控日志
    await this.elasticsearchService.clearAllData(projectId);
  }

  /**
   * 删除超过指定天数的数据（默认30天）
   */
  async deleteOldData(projectId: string, days: number = 30): Promise<void> {
    console.log(`🧹 Starting cleanup: deleting data older than ${days} days for project: ${projectId}`);

    try {
      // 1. 删除 MongoDB 中超过30天的错误数据
      await this.errorService.deleteOldData(projectId, days);

      // 2. 删除 InfluxDB 中超过30天的数据
      await this.influxDBService.deleteOldData(projectId, days);

      // 3. 删除 Elasticsearch 中超过30天的监控日志
      await this.elasticsearchService.deleteOldData(projectId, days);

      // Redis 缓存会自动过期，不需要手动删除

      console.log(`✅ Cleanup completed: deleted data older than ${days} days`);
    } catch (error: any) {
      console.error('❌ Cleanup failed:', error.message || error);
    }
  }
}

