import { Provide, Scope, ScopeEnum, Config, Init, Destroy } from '@midwayjs/core';
import { Client } from '@elastic/elasticsearch';

/**
 * Elasticsearch 服务
 * 用于存储和查询监控日志
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class ElasticsearchService {
  private client: Client;
  
  @Config('elasticsearch')
  elasticsearchConfig: any;

  @Init()
  async init() {
    try {
      this.client = new Client({
        node: this.elasticsearchConfig?.node || 'http://localhost:9200',
        ...(this.elasticsearchConfig?.auth && {
          auth: this.elasticsearchConfig.auth
        }),
        // 添加连接超时和重试配置
        requestTimeout: 5000,
        pingTimeout: 3000,
        maxRetries: 1,
      });

      // 检查连接（使用 ping 而不是 health，更快）
      await this.client.ping();
      console.log('✅ Elasticsearch connected successfully');

      // 确保索引存在
      await this.ensureIndex();
      
      // 测试查询，检查是否有数据
      try {
        const testResult = await this.client.count({ index: 'monitor-logs' });
        console.log('📊 Elasticsearch index document count:', testResult.count);
      } catch (error: any) {
        console.warn('⚠️ Failed to count documents:', error.message);
      }
    } catch (error: any) {
      console.warn('⚠️ Elasticsearch connection failed:', error.message);
      console.warn('⚠️ Log query feature will be disabled');
      console.warn('⚠️ Please ensure Elasticsearch is running at:', this.elasticsearchConfig?.node || 'http://localhost:9200');
      // 不设置 client，这样 isConnected() 会返回 false
      this.client = null as any;
    }
  }

  @Destroy()
  async destroy() {
    if (this.client) {
      await this.client.close();
    }
  }

  /**
   * 确保索引存在
   */
  private async ensureIndex() {
    if (!this.client) return;

    const indexName = 'monitor-logs';
    const exists = await this.client.indices.exists({ index: indexName });

    if (!exists) {
      await this.client.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              projectId: { type: 'keyword' },
              type: { type: 'keyword' }, // error, performance, behavior, api
              userId: { type: 'keyword' },
              sessionId: { type: 'keyword' },
              url: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              path: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              message: { type: 'text' },
              stack: { type: 'text' },
              timestamp: { type: 'date' },
              '@timestamp': { type: 'date' },
              userAgent: { type: 'text' },
              // 原始数据（JSON格式）
              rawData: { type: 'object', enabled: false }, // 存储完整原始数据，不索引
              // 错误相关
              errorType: { type: 'keyword' },
              errorMessage: { type: 'text' },
              // 性能相关
              loadTime: { type: 'integer' },
              fcp: { type: 'float' },
              lcp: { type: 'float' },
              fid: { type: 'float' },
              cls: { type: 'float' },
              // 行为相关
              behaviorType: { type: 'keyword' },
              // API相关
              method: { type: 'keyword' },
              status: { type: 'integer' },
              responseTime: { type: 'integer' },
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          }
        }
      });
      console.log('✅ Elasticsearch index created: monitor-logs');
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return !!this.client;
  }

  /**
   * 写入日志
   */
  async writeLog(data: {
    projectId: string;
    type: 'error' | 'performance' | 'behavior' | 'api';
    userId?: string;
    sessionId?: string;
    url?: string;
    path?: string;
    timestamp: string;
    [key: string]: any;
  }) {
    if (!this.client) {
      console.warn('⚠️ Elasticsearch client not available, skipping log write');
      return;
    }

    try {
      const indexName = 'monitor-logs';
      const timestamp = data.timestamp || new Date().toISOString();
      const doc = {
        ...data,
        rawData: data, // 保存完整原始数据
        '@timestamp': new Date(timestamp).toISOString(),
      };

      const result = await this.client.index({
        index: indexName,
        body: doc,
      });
      
      // 仅在开发环境记录详细日志，生产环境减少日志输出
      if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development') {
        console.log('✅ Log written to Elasticsearch:', { 
          type: data.type, 
          projectId: data.projectId, 
          userId: data.userId,
          _id: result._id,
        });
      }
    } catch (error: any) {
      console.error('❌ Elasticsearch write error:', error.message || error);
      // 在错误处理中，doc 可能未定义，所以使用 data
      console.error('❌ Failed document data:', JSON.stringify(data, null, 2));
    }
  }

  /**
   * 查询日志
   */
  async searchLogs(params: {
    projectId?: string;
    userId?: string;
    type?: string;
    keyword?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    pageSize?: number;
    sort?: { [key: string]: { order: 'asc' | 'desc' } };
  }) {
    if (!this.client) {
      console.warn('⚠️ Elasticsearch client not available, returning empty results');
      return {
        total: 0,
        hits: [],
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      };
    }

    const {
      projectId,
      userId,
      type,
      keyword,
      startTime,
      endTime,
      page = 1,
      pageSize = 20,
      sort = { '@timestamp': { order: 'desc' } },
    } = params;

    const must: any[] = [];
    const should: any[] = [];

    // 项目ID过滤
    if (projectId) {
      must.push({ term: { projectId } });
    }

    // 用户ID过滤
    if (userId) {
      must.push({ term: { userId } });
    }

          // 类型过滤（排除性能监控）
          if (type) {
            if (type === 'performance') {
              // 如果指定了性能监控类型，则排除它（不查询性能监控）
              must.push({ bool: { must_not: [{ term: { type: 'performance' } }] } });
            } else {
              must.push({ term: { type } });
            }
          } else {
            // 如果没有指定类型，默认排除性能监控
            must.push({ bool: { must_not: [{ term: { type: 'performance' } }] } });
          }

    // 时间范围过滤
    if (startTime || endTime) {
      const range: any = {};
      if (startTime) {
        range.gte = startTime;
      }
      if (endTime) {
        range.lte = endTime;
      }
      must.push({ range: { '@timestamp': range } });
      console.log('⏰ Time range filter:', range);
    } else {
      // 如果没有指定时间范围，默认查询最近7天，截止到当前时间
      const defaultEndTime = new Date().toISOString();
      const defaultStartTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      must.push({ 
        range: { 
          '@timestamp': { 
            gte: defaultStartTime,
            lte: defaultEndTime
          } 
        } 
      });
      console.log('⏰ Using default time range (last 7 days):', { gte: defaultStartTime, lte: defaultEndTime });
    }

    // 关键字搜索（全文搜索）
    if (keyword) {
      should.push(
        { match: { message: keyword } },
        { match: { errorMessage: keyword } },
        { match: { url: keyword } },
        { match: { path: keyword } },
        { match: { stack: keyword } },
        { wildcard: { userId: `*${keyword}*` } },
        { wildcard: { sessionId: `*${keyword}*` } }
      );
    }

    const query: any = {};
    if (must.length > 0 || should.length > 0) {
      query.bool = {};
      if (must.length > 0) query.bool.must = must;
      if (should.length > 0) {
        query.bool.should = should;
        query.bool.minimum_should_match = should.length > 0 ? 1 : 0;
      }
    } else {
      query.match_all = {};
    }

    try {
      // 调试：输出查询条件
      console.log('🔍 Elasticsearch search params:', {
        projectId,
        userId,
        type,
        keyword,
        startTime,
        endTime,
        page,
        pageSize
      });
      console.log('🔍 Elasticsearch query:', JSON.stringify(query, null, 2));
      
      // 先检查索引是否存在（使用 try-catch 处理连接错误）
      let indexExists = false;
      try {
        indexExists = await this.client.indices.exists({ index: 'monitor-logs' });
      } catch (error: any) {
        console.error('❌ Failed to check index existence:', error.message);
        // 如果是连接错误，返回空结果
        if (error.message && error.message.includes('Connection')) {
          return {
            total: 0,
            hits: [],
            page,
            pageSize,
          };
        }
        throw error;
      }
      
      if (!indexExists) {
        console.warn('⚠️ Index monitor-logs does not exist, creating...');
        try {
          await this.ensureIndex();
        } catch (error: any) {
          console.error('❌ Failed to create index:', error.message);
        }
        return {
          total: 0,
          hits: [],
          page,
          pageSize,
        };
      }
      
      const result = await this.client.search({
        index: 'monitor-logs',
        body: {
          query,
          sort: [sort],
          from: (page - 1) * pageSize,
          size: pageSize,
          _source: true,
        },
      });

      const hits = result.hits.hits.map((hit: any) => ({
        _id: hit._id,
        ...hit._source,
      }));

      // 处理 total 字段（可能是 number 或 { value: number } 格式）
      const totalValue = typeof result.hits.total === 'object' 
        ? (result.hits.total as any).value 
        : result.hits.total;

      console.log('📊 Elasticsearch search result:', {
        total: totalValue,
        hitsCount: hits.length,
        firstHit: hits[0] ? { 
          type: hits[0].type, 
          timestamp: hits[0]['@timestamp'],
          userId: hits[0].userId,
          projectId: hits[0].projectId
        } : null,
      });

      return {
        total: totalValue || 0,
        hits,
        page,
        pageSize,
      };
    } catch (error: any) {
      console.error('❌ Elasticsearch search error:', error.message || error);
      
      // 如果是连接错误，给出友好提示
      if (error.message && (error.message.includes('Connection') || error.message.includes('ECONNREFUSED'))) {
        console.error('❌ Elasticsearch connection failed. Please ensure Elasticsearch is running.');
        console.error('❌ Elasticsearch URL:', this.elasticsearchConfig?.node || 'http://localhost:9200');
      } else if (error.message && error.message.includes('index_not_found_exception')) {
        // 如果是索引不存在，尝试创建索引
        console.log('📝 Index not found, creating index...');
        try {
          await this.ensureIndex();
        } catch (createError: any) {
          console.error('❌ Failed to create index:', createError.message);
        }
      }
      
      return {
        total: 0,
        hits: [],
        page,
        pageSize,
      };
    }
  }

  /**
   * 删除旧日志（按时间范围）
   */
  async deleteLogsByTimeRange(startTime: string, endTime: string) {
    if (!this.client) return;

    try {
      await this.client.deleteByQuery({
        index: 'monitor-logs',
        body: {
          query: {
            range: {
              '@timestamp': {
                gte: startTime,
                lte: endTime,
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Elasticsearch delete error:', error);
    }
  }

  /**
   * 清除指定项目的所有监控日志
   */
  async clearAllData(projectId: string): Promise<void> {
    if (!this.client) {
      console.warn('⚠️ Elasticsearch client not available, skipping clear all data');
      return;
    }

    try {
      const result = await this.client.deleteByQuery({
        index: 'monitor-logs',
        body: {
          query: {
            term: {
              projectId: projectId,
            },
          },
        },
        refresh: true, // 立即刷新索引
      });

      console.log(`✅ Cleared all Elasticsearch data for project: ${projectId}`, {
        deleted: result.deleted || 0,
      });
    } catch (error: any) {
      console.error('❌ Failed to clear Elasticsearch data:', error.message || error);
      // 不抛出错误，避免影响其他数据源的清除
    }
  }

  /**
   * 删除超过指定天数的监控日志
   */
  async deleteOldData(projectId: string, days: number = 30): Promise<void> {
    if (!this.client) {
      console.warn('⚠️ Elasticsearch client not available, skipping delete old data');
      return;
    }

    try {
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const result = await this.client.deleteByQuery({
        index: 'monitor-logs',
        body: {
          query: {
            bool: {
              must: [
                { term: { projectId: projectId } },
                {
                  range: {
                    '@timestamp': {
                      lt: cutoffTime,
                    },
                  },
                },
              ],
            },
          },
        },
        refresh: true,
      });

      console.log(`✅ Deleted Elasticsearch data older than ${days} days for project: ${projectId}`, {
        deleted: result.deleted || 0,
      });
    } catch (error: any) {
      console.error('❌ Failed to delete old Elasticsearch data:', error.message || error);
      // 不抛出错误，避免影响其他数据源的清理
    }
  }
}

