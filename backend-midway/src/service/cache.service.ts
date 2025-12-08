import { Provide, Inject, Config } from '@midwayjs/core';
import { RedisService } from '@midwayjs/redis';

/**
 * Redis 缓存服务
 * 
 * 缓存策略：
 * 1. 统计数据缓存：Dashboard、错误统计、性能统计等（TTL: 30-60s）
 * 2. 热点数据缓存：热门页面、热门接口（TTL: 1min）
 * 3. 实时计数：使用 Redis 原子操作进行实时计数
 */
@Provide()
export class CacheService {
  @Inject()
  redisService: RedisService;

  @Config('cache')
  cacheConfig: any;

  private readonly PREFIX = 'monitor:';

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisService.get(this.PREFIX + key);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return data as unknown as T;
        }
      }
      return null;
    } catch (error: any) {
      // Redis 连接失败时返回 null，不影响主流程
      console.warn('⚠️ Redis get failed:', error.message);
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await this.redisService.setex(this.PREFIX + key, ttl, data);
      } else {
        await this.redisService.set(this.PREFIX + key, data);
      }
    } catch (error: any) {
      // Redis 连接失败时静默失败，不影响主流程
      console.warn('⚠️ Redis set failed:', error.message);
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisService.del(this.PREFIX + key);
    } catch (error: any) {
      // Redis 连接失败时静默失败，不影响主流程
      console.warn('⚠️ Redis del failed:', error.message);
    }
  }

  /**
   * 删除匹配的缓存
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redisService.keys(this.PREFIX + pattern);
    if (keys.length > 0) {
      await this.redisService.del(...keys);
    }
  }

  /**
   * 缓存 Dashboard 数据
   */
  async getDashboard(projectId: string): Promise<any> {
    return this.get(`dashboard:${projectId}`);
  }

  async setDashboard(projectId: string, data: any): Promise<void> {
    await this.set(`dashboard:${projectId}`, data, this.cacheConfig.dashboardTTL);
  }

  /**
   * 缓存错误统计
   */
  async getErrorStats(projectId: string): Promise<any> {
    return this.get(`error:stats:${projectId}`);
  }

  async setErrorStats(projectId: string, data: any): Promise<void> {
    await this.set(`error:stats:${projectId}`, data, this.cacheConfig.statsTTL);
  }

  /**
   * 缓存性能统计
   */
  async getPerformanceStats(projectId: string): Promise<any> {
    return this.get(`performance:stats:${projectId}`);
  }

  async setPerformanceStats(projectId: string, data: any): Promise<void> {
    await this.set(`performance:stats:${projectId}`, data, this.cacheConfig.statsTTL);
  }

  /**
   * 缓存行为统计
   */
  async getBehaviorStats(projectId: string): Promise<any> {
    return this.get(`behavior:stats:${projectId}`);
  }

  async setBehaviorStats(projectId: string, data: any): Promise<void> {
    await this.set(`behavior:stats:${projectId}`, data, this.cacheConfig.statsTTL);
  }

  /**
   * 缓存接口统计
   */
  async getApiStats(projectId: string): Promise<any> {
    return this.get(`api:stats:${projectId}`);
  }

  async setApiStats(projectId: string, data: any): Promise<void> {
    await this.set(`api:stats:${projectId}`, data, this.cacheConfig.statsTTL);
  }

  /**
   * 实时计数 - 今日错误数
   */
  async incrTodayErrorCount(projectId: string): Promise<number> {
    try {
      const key = `error:today:${projectId}:${this.getTodayKey()}`;
      const count = await this.redisService.incr(this.PREFIX + key);
      // 设置过期时间为明天凌晨
      await this.redisService.expireat(
        this.PREFIX + key,
        Math.floor(this.getTomorrowTimestamp() / 1000)
      );
      return count;
    } catch (error: any) {
      // Redis 连接失败时返回 0，不影响主流程
      console.warn('⚠️ Redis incrTodayErrorCount failed:', error.message);
      return 0;
    }
  }

  async getTodayErrorCount(projectId: string): Promise<number> {
    try {
      const key = `error:today:${projectId}:${this.getTodayKey()}`;
      const count = await this.redisService.get(this.PREFIX + key);
      return parseInt(count || '0', 10);
    } catch (error: any) {
      console.warn('⚠️ Redis getTodayErrorCount failed:', error.message);
      return 0;
    }
  }

  /**
   * 增加今日指定类型的错误计数
   */
  async incrTodayErrorCountByType(projectId: string, type: string): Promise<number> {
    try {
      const key = `error:today:${projectId}:${type}:${this.getTodayKey()}`;
      const count = await this.redisService.incr(this.PREFIX + key);
      // 设置过期时间为明天凌晨
      await this.redisService.expireat(
        this.PREFIX + key,
        Math.floor(this.getTomorrowTimestamp() / 1000)
      );
      return count;
    } catch (error: any) {
      console.warn('⚠️ Redis incrTodayErrorCountByType failed:', error.message);
      return 0;
    }
  }

  /**
   * 获取今日指定类型的错误计数
   */
  async getTodayErrorCountByType(projectId: string, type: string): Promise<number> {
    const key = `error:today:${projectId}:${type}:${this.getTodayKey()}`;
    const count = await this.redisService.get(this.PREFIX + key);
    return parseInt(count || '0', 10);
  }

  /**
   * 实时计数 - 今日 PV
   */
  async incrTodayPV(projectId: string): Promise<number> {
    const key = `pv:today:${projectId}:${this.getTodayKey()}`;
    const count = await this.redisService.incr(this.PREFIX + key);
    await this.redisService.expireat(
      this.PREFIX + key,
      Math.floor(this.getTomorrowTimestamp() / 1000)
    );
    return count;
  }

  async getTodayPV(projectId: string): Promise<number> {
    const key = `pv:today:${projectId}:${this.getTodayKey()}`;
    const count = await this.redisService.get(this.PREFIX + key);
    return parseInt(count || '0', 10);
  }

  /**
   * 实时计数 - 今日 UV（使用 HyperLogLog）
   */
  async addTodayUV(projectId: string, sessionId: string): Promise<void> {
    try {
      const key = `uv:today:${projectId}:${this.getTodayKey()}`;
      await this.redisService.pfadd(this.PREFIX + key, sessionId);
      await this.redisService.expireat(
        this.PREFIX + key,
        Math.floor(this.getTomorrowTimestamp() / 1000)
      );
    } catch (error: any) {
      // Redis 连接失败时静默失败，不影响主流程
      console.warn('⚠️ Redis addTodayUV failed:', error.message);
    }
  }

  async getTodayUV(projectId: string): Promise<number> {
    try {
      const key = `uv:today:${projectId}:${this.getTodayKey()}`;
      return await this.redisService.pfcount(this.PREFIX + key);
    } catch (error: any) {
      // Redis 连接失败时返回 0
      console.warn('⚠️ Redis getTodayUV failed:', error.message);
      return 0;
    }
  }

  /**
   * 错误受影响用户管理（使用 Redis Set）
   */
  async addToUserSet(key: string, userId: string): Promise<boolean> {
    try {
      const result = await this.redisService.sadd(this.PREFIX + key, userId);
      // 设置过期时间为 30 天
      await this.redisService.expire(this.PREFIX + key, 30 * 24 * 60 * 60);
      // 返回是否是新用户（result > 0 表示添加成功，即新用户）
      return result > 0;
    } catch (error: any) {
      // Redis 连接失败时返回 false，不影响主流程
      console.warn('⚠️ Redis addToUserSet failed:', error.message);
      return false;
    }
  }

  async getUserSetSize(key: string): Promise<number> {
    try {
      return await this.redisService.scard(this.PREFIX + key);
    } catch (error: any) {
      // Redis 连接失败时返回 0
      console.warn('⚠️ Redis getUserSetSize failed:', error.message);
      return 0;
    }
  }

  /**
   * 清除项目相关的所有缓存
   */
  async invalidateProjectCache(projectId: string): Promise<void> {
    await this.delPattern(`*:${projectId}*`);
  }

  /**
   * 清除所有缓存和计数
   */
  async clearAllCache(projectId: string): Promise<void> {
    try {
      // 使用 delPattern 清除所有匹配的 key
      await this.delPattern(`*${projectId}*`);
      
      // 也清除通用的缓存 key
      await this.del(`api:stats:${projectId}`);
      await this.del(`error:stats:${projectId}`);
      await this.del(`dashboard:${projectId}`);
      
      console.log(`✅ Cleared all Redis cache for project: ${projectId}`);
    } catch (error) {
      console.error('Failed to clear Redis cache:', error.message);
      throw error;
    }
  }

  private getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getTomorrowTimestamp(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
}

