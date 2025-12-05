import { Provide, Inject, Init } from '@midwayjs/core';
import { getModelForClass, ReturnModelType } from '@typegoose/typegoose';
import { ErrorLog } from '../entity/error.entity';
import { InfluxDBService } from './influxdb.service';
import { CacheService } from './cache.service';
import * as crypto from 'crypto';

@Provide()
export class ErrorService {
  errorModel: ReturnModelType<typeof ErrorLog>;

  @Init()
  async init() {
    this.errorModel = getModelForClass(ErrorLog);
  }

  @Inject()
  influxDBService: InfluxDBService;

  @Inject()
  cacheService: CacheService;

  /**
   * 生成错误指纹
   */
  private generateErrorHash(message: string, stack?: string, url?: string): string {
    const content = `${message}|${stack?.substring(0, 200) || ''}|${url || ''}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 上报错误
   */
  async report(data: {
    projectId: string;
    type: string;
    message: string;
    stack?: string;
    url?: string;
    line?: number;
    col?: number;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
  }): Promise<ErrorLog> {
    const timestamp = new Date();
    const errorHash = this.generateErrorHash(data.message, data.stack, data.url);

    // 尝试查找已存在的相同错误（聚合）
    // 使用 lean() 避免类型转换问题，特别是对于可能类型不一致的旧数据
    const existingError = await this.errorModel.findOne({
      projectId: data.projectId,
      errorHash,
    }).lean();

    let error: ErrorLog;

    if (existingError) {
      // 更新已有错误的计数和最后出现时间
      const currentUser = data.userId || data.sessionId || 'anonymous';
      const errorId = existingError._id!.toString();
      
      // 使用 Redis Set 来精确统计受影响用户数
      const userSetKey = `error:users:${errorId}`;
      const isNewUser = await this.cacheService.addToUserSet(userSetKey, currentUser);
      
      // 获取实际的受影响用户数（从 Redis Set）
      const actualUserCount = await this.cacheService.getUserSetSize(userSetKey);
      
      // 确保 affectedUsers 是数字类型
      const affectedUsersCount = Number(actualUserCount) || 1;
      
      // 更新错误记录
      const updateData: any = {
        $inc: { count: 1 },
        $set: { 
          lastSeen: timestamp,
          affectedUsers: affectedUsersCount, // 确保是数字类型
        },
      };
      
      error = await this.errorModel.findByIdAndUpdate(
        existingError._id,
        updateData,
        { new: true }
      );
    } else {
      // 创建新错误记录
      // 明确指定字段，避免 ...data 展开时包含不应该的字段
      error = await this.errorModel.create({
        projectId: data.projectId,
        type: data.type,
        message: data.message,
        stack: data.stack,
        url: data.url,
        line: data.line,
        col: data.col,
        userAgent: data.userAgent,
        userId: data.userId,
        sessionId: data.sessionId,
        timestamp,
        errorHash,
        count: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
        affectedUsers: 1,
      });
      
      // 初始化用户集合
      const currentUser = data.userId || data.sessionId || 'anonymous';
      const errorId = error._id!.toString();
      const userSetKey = `error:users:${errorId}`;
      await this.cacheService.addToUserSet(userSetKey, currentUser);
    }

    // 写入 InfluxDB（用于时序统计）
    await this.influxDBService.writeErrorCount(data.projectId, data.type);

    // 更新实时计数
    await this.cacheService.incrTodayErrorCount(data.projectId);
    
    // 更新今日指定类型的错误计数（只统计js和promise）
    if (data.type === 'js' || data.type === 'promise') {
      await this.cacheService.incrTodayErrorCountByType(data.projectId, data.type);
    }

    // 清除统计缓存
    await this.cacheService.del(`error:stats:${data.projectId}`);
    await this.cacheService.del(`dashboard:${data.projectId}`);

    return error;
  }

  /**
   * 获取错误列表
   */
  async findList(params: {
    projectId: string;
    type?: string;
    page?: number;
    pageSize?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<{ data: ErrorLog[]; total: number }> {
    const { projectId, type, page = 1, pageSize = 20, startTime, endTime } = params;

    const query: any = { projectId };

    if (type) {
      query.type = type;
    }

    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    const [data, total] = await Promise.all([
      this.errorModel
        .find(query)
        .sort({ lastSeen: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      this.errorModel.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * 获取错误详情
   */
  async findById(id: string): Promise<ErrorLog | null> {
    return this.errorModel.findById(id);
  }

  /**
   * 获取错误统计
   */
  async getStats(projectId: string): Promise<any> {
    // 尝试从缓存获取
    const cached = await this.cacheService.getErrorStats(projectId);
    if (cached) {
      return cached;
    }

    // 检查数据库连接
    if (!this.errorModel) {
      return { total: 0, typeStats: {}, timeStats: {} };
    }

    try {
      // 获取总错误数 - 使用聚合统计，累加所有错误的count字段
      // 因为错误是聚合的，count字段表示该错误发生的次数
      const totalResult = await this.errorModel.aggregate([
        { $match: { projectId } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      // 按类型统计
      const typeStats = await this.errorModel.aggregate([
        { $match: { projectId } },
        { $group: { _id: '$type', count: { $sum: '$count' } } },
      ]);

      const typeStatsMap: Record<string, number> = {};
      typeStats.forEach(item => {
        typeStatsMap[item._id] = item.count;
      });

      // 获取时间趋势
      const trend = await this.influxDBService.queryErrorTrend(projectId, 7);
      const timeStats: Record<string, number> = {};
      trend.forEach((item: any) => {
        const date = new Date(item.time).toISOString().split('T')[0];
        timeStats[date] = item.count || 0;
      });

      const stats = {
        total,
        typeStats: typeStatsMap,
        timeStats,
      };

      // 缓存结果
      await this.cacheService.setErrorStats(projectId, stats);

      return stats;
    } catch (error) {
      console.warn('Error stats query failed:', error.message);
      return { total: 0, typeStats: {}, timeStats: {} };
    }
  }

  /**
   * 获取今日错误类型统计（只统计js和promise）
   * 使用 Redis 实时计数，更准确
   */
  async getTodayTypeStats(projectId: string): Promise<Record<string, number>> {
    try {
      // 从 Redis 获取今日的 js 和 promise 错误计数
      const [jsCount, promiseCount] = await Promise.all([
        this.cacheService.getTodayErrorCountByType(projectId, 'js'),
        this.cacheService.getTodayErrorCountByType(projectId, 'promise'),
      ]);

      const typeStatsMap: Record<string, number> = {};
      if (jsCount > 0) {
        typeStatsMap['js'] = jsCount;
      }
      if (promiseCount > 0) {
        typeStatsMap['promise'] = promiseCount;
      }

      // 调试日志
      console.log('Today type stats from Redis:', {
        projectId,
        jsCount,
        promiseCount,
        typeStatsMap
      });

      return typeStatsMap;
    } catch (error) {
      console.warn('Get today type stats failed:', error.message);
      return {};
    }
  }

  /**
   * 删除超过指定天数的错误数据
   */
  async deleteOldData(projectId: string, days: number = 30): Promise<void> {
    if (!this.errorModel) return;

    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await this.errorModel.deleteMany({
        projectId,
        createdAt: { $lt: cutoffDate },
      });
      console.log(`✅ Deleted ${result.deletedCount} error records older than ${days} days for project: ${projectId}`);
    } catch (error: any) {
      console.error('Failed to delete old error data:', error.message);
      // 不抛出错误，避免影响其他数据源的清理
    }
  }
}

