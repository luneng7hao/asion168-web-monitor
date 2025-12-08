import { Provide, Scope, ScopeEnum, Config, Init } from '@midwayjs/core';
import { InfluxDB, IPoint, FieldType } from 'influx';

/**
 * InfluxDB 服务
 * 用于存储时序数据：性能指标、用户行为统计、接口监控
 * 
 * 数据存储策略：
 * - performance: 性能数据（loadTime, fcp, lcp, fid, cls）
 * - behavior: 用户行为数据（pv, uv, click）
 * - api_monitor: 接口监控数据（responseTime, status）
 * - error_count: 错误计数（按时间聚合）
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class InfluxDBService {
  private client: InfluxDB;

  @Config('influxdb')
  influxConfig: any;

  @Init()
  async init() {
    try {
      this.client = new InfluxDB({
        host: this.influxConfig.host,
        port: this.influxConfig.port,
        database: this.influxConfig.database,
        username: this.influxConfig.username,
        password: this.influxConfig.password,
        schema: [
        {
          measurement: 'performance',
          fields: {
            loadTime: FieldType.INTEGER,
            domReady: FieldType.INTEGER,
            fcp: FieldType.INTEGER,
            lcp: FieldType.INTEGER,
            fid: FieldType.INTEGER,
            cls: FieldType.FLOAT,
            dns: FieldType.INTEGER,
            tcp: FieldType.INTEGER,
            ttfb: FieldType.INTEGER,
          },
          tags: ['projectId', 'url', 'userId', 'sessionId'],
        },
        {
          measurement: 'behavior',
          fields: {
            count: FieldType.INTEGER,
            sessionId: FieldType.STRING, // sessionId 作为 field 存储，以便使用 COUNT(DISTINCT()) 查询
            userId: FieldType.STRING, // userId 也作为 field 存储，以便用于自定义事件和路由变化的 UV 统计
            data: FieldType.STRING, // 详细数据（JSON字符串），用于存储点击事件和自定义事件的详细信息
          },
          tags: ['projectId', 'type', 'url', 'path', 'userId'],
        },
        {
          measurement: 'api_monitor',
          fields: {
            responseTime: FieldType.INTEGER,
            status: FieldType.INTEGER,
            requestData: FieldType.STRING, // 请求参数（JSON字符串）
            responseData: FieldType.STRING, // 响应数据（JSON字符串）
            // 不再使用 success 字段，改为在查询时基于 status 判断
          },
          tags: ['projectId', 'url', 'method', 'userId', 'sessionId'],
        },
        {
          measurement: 'error_count',
          fields: {
            count: FieldType.INTEGER,
          },
          tags: ['projectId', 'type'],
        },
      ],
    });

      // 确保数据库存在
      const databases = await this.client.getDatabaseNames();
      if (!databases.includes(this.influxConfig.database)) {
        await this.client.createDatabase(this.influxConfig.database);
        console.log(`Created InfluxDB database: ${this.influxConfig.database}`);
      }
      console.log('✅ InfluxDB connected');
    } catch (error) {
      console.warn('⚠️ InfluxDB connection failed, time-series features disabled:', error.message);
      this.client = null;
    }
  }

  private isConnected(): boolean {
    return this.client !== null;
  }

  /**
   * 写入性能数据
   */
  async writePerformance(data: {
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
  }) {
    if (!this.isConnected()) return;
    
    // 验证 loadTime 数据有效性（过滤负数或异常大的值）
    const loadTime = data.loadTime || 0;
    if (loadTime <= 0 || loadTime > 60000) {
      console.warn('Invalid loadTime detected, skipping:', loadTime);
      return;
    }
    
    const point: IPoint = {
      measurement: 'performance',
      tags: {
        projectId: data.projectId || 'unknown',
        url: data.url || 'unknown',
        userId: data.userId || 'anonymous',
        sessionId: data.sessionId || 'none',
      },
      fields: {
        loadTime: loadTime,
        domReady: data.domReady || 0,
        fcp: data.fcp || 0,
        lcp: data.lcp || 0,
        fid: data.fid || 0,
        cls: data.cls || 0,
        dns: data.dns || 0,
        tcp: data.tcp || 0,
        ttfb: data.ttfb || 0,
      },
    };

    await this.client.writePoints([point]);
  }

  /**
   * 写入用户行为数据
   */
  async writeBehavior(data: {
    projectId: string;
    type: string;
    url: string;
    path?: string;
    userId?: string;
    sessionId?: string;
    data?: any; // 详细数据（用于点击事件和自定义事件）
  }) {
    if (!this.isConnected()) return;
    
    const point: IPoint = {
      measurement: 'behavior',
      tags: {
        projectId: data.projectId || 'unknown',
        type: data.type || 'unknown',
        url: data.url || 'unknown',
        path: data.path || 'none',
        userId: data.userId || 'anonymous',
      },
      fields: {
        count: 1,
        // sessionId 作为 field 存储，以便使用 COUNT(DISTINCT()) 查询
        sessionId: data.sessionId || 'none',
        // userId 也作为 field 存储，以便用于自定义事件和路由变化的 UV 统计
        userId: data.userId || 'anonymous',
        // 存储详细数据为JSON字符串（用于点击事件和自定义事件）
        data: data.data ? JSON.stringify(data.data) : '',
      },
    };

    await this.client.writePoints([point]);
  }

  /**
   * 写入接口监控数据
   */
  /**
   * 写入接口监控数据
   */
  async writeApiMonitor(data: {
    projectId: string;
    url: string;
    method: string;
    status: number;
    responseTime: number;
    userId?: string;
    sessionId?: string;
    requestData?: any;
    responseData?: any;
  }) {
    if (!this.isConnected()) {
      if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development') {
        console.warn('⚠️ InfluxDB not connected, cannot write API monitor data');
      }
      return;
    }
    
    const point: IPoint = {
      measurement: 'api_monitor',
      tags: {
        projectId: data.projectId || 'unknown',
        url: data.url || 'unknown',
        method: data.method || 'GET',
        userId: data.userId || 'anonymous',
        sessionId: data.sessionId || 'none',
      },
      fields: {
        responseTime: data.responseTime,
        status: data.status,
        // 存储请求和响应数据为JSON字符串
        requestData: data.requestData ? JSON.stringify(data.requestData) : '',
        responseData: data.responseData ? JSON.stringify(data.responseData) : '',
      },
    };

    try {
      await this.client.writePoints([point]);
      if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development') {
        console.log('✅ InfluxDB writeApiMonitor success:', {
          projectId: data.projectId,
          url: data.url,
          method: data.method
        });
      }
    } catch (error: any) {
      console.error('❌ InfluxDB writeApiMonitor failed:', error.message);
      throw error;
    }
  }

  /**
   * 写入错误计数
   */
  async writeErrorCount(projectId: string, type: string) {
    if (!this.isConnected()) return;
    
    const point: IPoint = {
      measurement: 'error_count',
      tags: {
        projectId,
        type,
      },
      fields: {
        count: 1,
      },
    };

    await this.client.writePoints([point]);
  }

  /**
   * 查询性能统计
   */
  async queryPerformanceStats(projectId: string, startTime: string, endTime: string) {
    if (!this.isConnected()) return [];
    
    // 添加数据过滤条件，排除异常值（负数或超过60秒的数据）
    const query = `
      SELECT 
        MEAN("loadTime") as avgLoadTime,
        MEAN("fcp") as avgFcp,
        MEAN("lcp") as avgLcp,
        MEAN("fid") as avgFid,
        MEAN("cls") as avgCls,
        COUNT("loadTime") as count
      FROM "performance"
      WHERE "projectId" = '${projectId}'
        AND time >= '${startTime}'
        AND time <= '${endTime}'
        AND "loadTime" > 0
        AND "loadTime" <= 60000
    `;
    return this.client.query(query);
  }

  /**
   * 查询性能趋势（按天）
   */
  async queryPerformanceTrend(projectId: string, days: number = 7) {
    if (!this.isConnected()) return [];
    
    // 添加数据过滤条件，排除异常值（负数或超过60秒的数据）
    const query = `
      SELECT 
        MEAN("loadTime") as avgLoadTime,
        COUNT("loadTime") as count
      FROM "performance"
      WHERE "projectId" = '${projectId}'
        AND time >= now() - ${days}d
        AND "loadTime" > 0
        AND "loadTime" <= 60000
      GROUP BY time(1d) fill(0)
    `;
    return this.client.query(query);
  }

  /**
   * 查询行为统计
   */
  async queryBehaviorStats(projectId: string, startTime: string, endTime: string, type: string = 'pv') {
    if (!this.isConnected()) return { count: 0, uv: 0 };
    
    const countQuery = `
      SELECT COUNT("count") as count
      FROM "behavior"
      WHERE "projectId" = '${projectId}'
        AND "type" = '${type}'
        AND time >= '${startTime}'
        AND time <= '${endTime}'
    `;

    // 对于自定义事件和路由变化，使用 userId 统计 UV；对于 PV 和 click，使用 sessionId
    const useUserIdForUV = type === 'custom' || type === 'route-change';
    const uvField = useUserIdForUV ? 'userId' : 'sessionId';
    const uvFilter = useUserIdForUV ? 'AND "userId" != \'anonymous\' AND "userId" != \'\'' : 'AND "sessionId" != \'none\' AND "sessionId" != \'\'';
    
    const uvQuery = `
      SELECT COUNT(DISTINCT("${uvField}")) as uv
      FROM "behavior"
      WHERE "projectId" = '${projectId}'
        AND "type" = '${type}'
        AND time >= '${startTime}'
        AND time <= '${endTime}'
        ${uvFilter}
    `;

    // 调试日志：记录查询参数
    if (type === 'route-change' || type === 'custom') {
      console.log(`🔍 Querying ${type} UV - field: ${uvField}, filter: ${uvFilter}`);
      
      // 查询所有不同的 userId 值，用于调试
      const debugQuery = `
        SELECT DISTINCT("${uvField}") as distinctValue
        FROM "behavior"
        WHERE "projectId" = '${projectId}'
          AND "type" = '${type}'
          AND time >= '${startTime}'
          AND time <= '${endTime}'
      `;
      try {
        const debugResult = await this.client.query(debugQuery);
        const distinctValues = debugResult.map((item: any) => item.distinctValue).filter(Boolean);
        console.log(`🔍 ${type} distinct ${uvField} values:`, distinctValues);
      } catch (e) {
        console.warn('Debug query failed:', e);
      }
    }

    const [countResult, uvResult] = await Promise.all([
      this.client.query(countQuery),
      this.client.query(uvQuery),
    ]);

    const uv = (uvResult[0] as any)?.uv || 0;
    
    // 调试日志：记录查询结果
    if (type === 'route-change' || type === 'custom') {
      console.log(`📈 ${type} UV result: ${uv}, count: ${(countResult[0] as any)?.count || 0}`);
    }

    return {
      count: (countResult[0] as any)?.count || 0,
      uv: uv,
    };
  }

  /**
   * 查询行为趋势（按天）
   */
  async queryBehaviorTrend(projectId: string, days: number = 7, type: string = 'pv') {
    if (!this.isConnected()) return [];
    
    // 对于自定义事件和路由变化，使用 userId 统计 UV；对于 PV 和 click，使用 sessionId
    const useUserIdForUV = type === 'custom' || type === 'route-change';
    const uvField = useUserIdForUV ? 'userId' : 'sessionId';
    const uvFilter = useUserIdForUV ? 'AND "userId" != \'anonymous\' AND "userId" != \'\'' : 'AND "sessionId" != \'none\' AND "sessionId" != \'\'';
    
    const query = `
      SELECT 
        COUNT("count") as count,
        COUNT(DISTINCT("${uvField}")) as uv
      FROM "behavior"
      WHERE "projectId" = '${projectId}'
        AND "type" = '${type}'
        AND time >= now() - ${days}d
        ${uvFilter}
      GROUP BY time(1d) fill(0)
    `;
    const results = await this.client.query(query);
    
    // 格式化日期为 YYYY-MM-DD
    return results.map((item: any) => {
      const timeKey = item.time instanceof Date 
        ? item.time.toISOString().split('T')[0]
        : new Date(item.time).toISOString().split('T')[0];
      return {
        ...item,
        time: timeKey,
      };
    });
  }

  /**
   * 查询热门页面（按URL+用户ID分组）
   */
  async queryTopPages(projectId: string, limit: number = 10) {
    if (!this.isConnected()) return [];
    
    try {
      const query = `
        SELECT COUNT("count") as count
        FROM "behavior"
        WHERE "projectId" = '${projectId}'
          AND "type" = 'pv'
          AND time >= now() - 7d
        GROUP BY "url", "userId"
      `;
      const results = await this.client.query(query);
      // 格式化结果，包含 userId
      const formatted = results.map((item: any) => ({
        url: item.url || 'unknown',
        userId: item.userId || 'anonymous',
        count: item.count || 0
      }));
      // 在应用层排序和限制
      return formatted.sort((a: any, b: any) => (b.count || 0) - (a.count || 0)).slice(0, limit);
    } catch (error) {
      console.warn('queryTopPages failed:', error.message);
      return [];
    }
  }

  /**
   * 查询热门行为项（支持按类型，按URL+用户ID分组）
   */
  async queryTopBehaviorItems(projectId: string, limit: number = 10, type: string = 'pv') {
    if (!this.isConnected()) return [];
    
    try {
      const query = `
        SELECT COUNT("count") as count
        FROM "behavior"
        WHERE "projectId" = '${projectId}'
          AND "type" = '${type}'
          AND time >= now() - 7d
        GROUP BY "url", "userId"
      `;
      const results = await this.client.query(query);
      // 格式化结果，包含 userId
      const formatted = results.map((item: any) => ({
        url: item.url || 'unknown',
        userId: item.userId || 'anonymous',
        count: item.count || 0
      }));
      // 在应用层排序和限制
      return formatted.sort((a: any, b: any) => (b.count || 0) - (a.count || 0)).slice(0, limit);
    } catch (error) {
      console.warn('queryTopBehaviorItems failed:', error.message);
      return [];
    }
  }

  /**
   * 查询行为事件详情列表（用于点击事件和自定义事件）
   */
  async queryBehaviorEvents(
    projectId: string,
    type: string,
    startTime: string,
    endTime: string,
    page: number = 1,
    pageSize: number = 20
  ) {
    if (!this.isConnected()) return [];
    
    try {
      // InfluxDB 1.x 不支持 LIMIT 和 OFFSET，需要在应用层处理
      const query = `
        SELECT 
          time,
          "url",
          "path",
          "userId",
          "sessionId",
          "data"
        FROM "behavior"
        WHERE "projectId" = '${projectId}'
          AND "type" = '${type}'
          AND time >= '${startTime}'
          AND time <= '${endTime}'
        ORDER BY time DESC
      `;
      
      const results = await this.client.query(query);
      
      // 在应用层进行分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = results.slice(startIndex, endIndex);
      
      // 格式化结果
      return paginatedResults.map((item: any) => {
        let data = {};
        try {
          if (item.data) {
            data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          }
        } catch (e) {
          console.warn('Failed to parse behavior data:', e);
        }
        
        return {
          time: item.time instanceof Date 
            ? item.time.toISOString() 
            : new Date(item.time).toISOString(),
          url: item.url || 'unknown',
          path: item.path || 'none',
          userId: item.userId || 'anonymous',
          sessionId: item.sessionId || 'none',
          data,
        };
      });
    } catch (error) {
      console.warn('queryBehaviorEvents failed:', error.message);
      return [];
    }
  }

  /**
   * 查询行为事件总数
   */
  async queryBehaviorEventsCount(
    projectId: string,
    type: string,
    startTime: string,
    endTime: string
  ): Promise<number> {
    if (!this.isConnected()) return 0;
    
    try {
      const query = `
        SELECT COUNT("count") as count
        FROM "behavior"
        WHERE "projectId" = '${projectId}'
          AND "type" = '${type}'
          AND time >= '${startTime}'
          AND time <= '${endTime}'
      `;
      
      const results = await this.client.query(query);
      return (results[0] as any)?.count || 0;
    } catch (error) {
      console.warn('queryBehaviorEventsCount failed:', error.message);
      return 0;
    }
  }

  /**
   * 查询接口统计
   */
  async queryApiStats(projectId: string, startTime: string, endTime: string) {
    if (!this.isConnected()) return [];
    
    // InfluxDB 1.x 不支持 CASE WHEN，使用两个查询分别统计总数和成功数
    const totalQuery = `
      SELECT 
        COUNT("responseTime") as total,
        MEAN("responseTime") as avgResponseTime
      FROM "api_monitor"
      WHERE "projectId" = '${projectId}'
        AND time >= '${startTime}'
        AND time <= '${endTime}'
    `;
    
    const successQuery = `
      SELECT 
        COUNT("responseTime") as success
      FROM "api_monitor"
      WHERE "projectId" = '${projectId}'
        AND "status" >= 200
        AND "status" < 400
        AND time >= '${startTime}'
        AND time <= '${endTime}'
    `;
    
    const [totalResult, successResult] = await Promise.all([
      this.client.query(totalQuery),
      this.client.query(successQuery)
    ]);
    
    // 合并结果
    const total = (totalResult[0] as any) || {};
    const success = (successResult[0] as any) || {};
    
    return [{
      total: total.total || 0,
      avgResponseTime: total.avgResponseTime || 0,
      success: success.success || 0
    }];
  }

  /**
   * 查询接口趋势（按天）
   */
  async queryApiTrend(projectId: string, days: number = 7) {
    if (!this.isConnected()) return [];
    
    // 使用两个查询分别统计总数和成功数
    const totalQuery = `
      SELECT 
        COUNT("responseTime") as total,
        MEAN("responseTime") as avgResponseTime
      FROM "api_monitor"
      WHERE "projectId" = '${projectId}'
        AND time >= now() - ${days}d
      GROUP BY time(1d) fill(0)
    `;
    
    const successQuery = `
      SELECT 
        COUNT("responseTime") as success
      FROM "api_monitor"
      WHERE "projectId" = '${projectId}'
        AND "status" >= 200
        AND "status" < 400
        AND time >= now() - ${days}d
      GROUP BY time(1d) fill(0)
    `;
    
    const [totalResults, successResults] = await Promise.all([
      this.client.query(totalQuery),
      this.client.query(successQuery)
    ]);
    
    // 创建成功数的映射（按时间，使用日期字符串作为key）
    const successMap = new Map();
    successResults.forEach((item: any) => {
      // InfluxDB 返回的时间可能是 Date 对象或字符串，统一转换为日期字符串
      const timeKey = item.time instanceof Date 
        ? item.time.toISOString().split('T')[0]
        : new Date(item.time).toISOString().split('T')[0];
      successMap.set(timeKey, item.success || 0);
    });
    
    // 合并结果
    return totalResults.map((item: any) => {
      const timeKey = item.time instanceof Date 
        ? item.time.toISOString().split('T')[0]
        : new Date(item.time).toISOString().split('T')[0];
      return {
        ...item,
        time: timeKey, // 统一使用日期字符串格式
        success: successMap.get(timeKey) || 0
      };
    });
  }

  /**
   * 查询接口错误详情
   */
  async queryApiErrors(projectId: string, url: string, method: string = 'GET', limit: number = 20) {
    if (!this.isConnected()) return [];
    
    try {
      const query = `
        SELECT 
          "url",
          "method",
          "status",
          "responseTime",
          "requestData",
          "responseData",
          time
        FROM "api_monitor"
        WHERE "projectId" = '${projectId}'
          AND "url" = '${url}'
          AND "method" = '${method}'
          AND ("status" < 200 OR "status" >= 400)
        ORDER BY time DESC
        LIMIT ${limit}
      `;
      
      const results = await this.client.query(query);
      
      return results.map((item: any) => {
        let requestData = null;
        let responseData = null;
        
        try {
          if (item.requestData) {
            requestData = typeof item.requestData === 'string' 
              ? JSON.parse(item.requestData) 
              : item.requestData;
          }
        } catch (e) {
          console.warn('Failed to parse requestData:', e);
        }
        
        try {
          if (item.responseData) {
            responseData = typeof item.responseData === 'string' 
              ? JSON.parse(item.responseData) 
              : item.responseData;
          }
        } catch (e) {
          console.warn('Failed to parse responseData:', e);
        }
        
        return {
          url: item.url || 'unknown',
          method: item.method || 'GET',
          status: item.status || 0,
          responseTime: item.responseTime || 0,
          requestData,
          responseData,
          time: item.time instanceof Date 
            ? item.time.toISOString() 
            : new Date(item.time).toISOString(),
        };
      });
    } catch (error) {
      console.warn('queryApiErrors failed:', error.message);
      return [];
    }
  }

  /**
   * 查询热门接口
   */
  async queryTopApis(projectId: string, limit: number = 10) {
    if (!this.isConnected()) return [];
    
    try {
      // 使用两个查询分别统计总数和成功数
      const totalQuery = `
        SELECT 
          COUNT("responseTime") as total,
          MEAN("responseTime") as avgResponseTime
        FROM "api_monitor"
        WHERE "projectId" = '${projectId}'
          AND time >= now() - 7d
        GROUP BY "url", "method", "userId"
      `;
      
      const successQuery = `
        SELECT 
          COUNT("responseTime") as success
        FROM "api_monitor"
        WHERE "projectId" = '${projectId}'
          AND "status" >= 200
          AND "status" < 400
          AND time >= now() - 7d
        GROUP BY "url", "method", "userId"
      `;
      
      const [totalResults, successResults] = await Promise.all([
        this.client.query(totalQuery),
        this.client.query(successQuery)
      ]);
      
      // 创建成功数的映射（按 url、method、userId）
      const successMap = new Map();
      successResults.forEach((item: any) => {
        const key = `${item.url || 'unknown'}_${item.method || 'GET'}_${item.userId || 'anonymous'}`;
        successMap.set(key, item.success || 0);
      });
      
      // 合并结果，包含 userId
      const merged = totalResults.map((item: any) => {
        const key = `${item.url || 'unknown'}_${item.method || 'GET'}_${item.userId || 'anonymous'}`;
        return {
          url: item.url || 'unknown',
          method: item.method || 'GET',
          userId: item.userId || 'anonymous',
          total: item.total || 0,
          avgResponseTime: item.avgResponseTime || 0,
          success: successMap.get(key) || 0
        };
      });
      
      // 在应用层排序和限制
      return merged.sort((a: any, b: any) => (b.total || 0) - (a.total || 0)).slice(0, limit);
    } catch (error) {
      console.warn('queryTopApis failed:', error.message);
      return [];
    }
  }

  /**
   * 查询错误趋势（按天）
   */
  async queryErrorTrend(projectId: string, days: number = 7) {
    if (!this.isConnected()) return [];
    
    const query = `
      SELECT SUM("count") as count
      FROM "error_count"
      WHERE "projectId" = '${projectId}'
        AND time >= now() - ${days}d
      GROUP BY time(1d) fill(0)
    `;
    return this.client.query(query);
  }

  /**
   * 清除所有监控数据
   */
  async clearAllData(projectId: string): Promise<void> {
    if (!this.isConnected()) return;
    
    try {
      // 删除 api_monitor 数据
      await this.client.query(`DELETE FROM "api_monitor" WHERE "projectId" = '${projectId}'`);
      
      // 删除 performance 数据
      await this.client.query(`DELETE FROM "performance" WHERE "projectId" = '${projectId}'`);
      
      // 删除 behavior 数据
      await this.client.query(`DELETE FROM "behavior" WHERE "projectId" = '${projectId}'`);
      
      // 删除 error_count 数据
      await this.client.query(`DELETE FROM "error_count" WHERE "projectId" = '${projectId}'`);
      
      console.log(`✅ Cleared all InfluxDB data for project: ${projectId}`);
    } catch (error) {
      console.error('Failed to clear InfluxDB data:', error.message);
      throw error;
    }
  }

  /**
   * 删除超过指定天数的数据
   */
  async deleteOldData(projectId: string, days: number = 30): Promise<void> {
    if (!this.isConnected()) return;

    try {
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const cutoffTimeStr = cutoffTime.toISOString();

      // 删除 api_monitor 数据
      await this.client.query(`DELETE FROM "api_monitor" WHERE "projectId" = '${projectId}' AND time < '${cutoffTimeStr}'`);
      
      // 删除 performance 数据
      await this.client.query(`DELETE FROM "performance" WHERE "projectId" = '${projectId}' AND time < '${cutoffTimeStr}'`);
      
      // 删除 behavior 数据
      await this.client.query(`DELETE FROM "behavior" WHERE "projectId" = '${projectId}' AND time < '${cutoffTimeStr}'`);
      
      // 删除 error_count 数据
      await this.client.query(`DELETE FROM "error_count" WHERE "projectId" = '${projectId}' AND time < '${cutoffTimeStr}'`);
      
      console.log(`✅ Deleted InfluxDB data older than ${days} days for project: ${projectId}`);
    } catch (error: any) {
      console.error('Failed to delete old InfluxDB data:', error.message);
      // 不抛出错误，避免影响其他数据源的清理
    }
  }
}

