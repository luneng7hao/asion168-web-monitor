import { Controller, Get, Post, Inject, Query, Body, Config } from '@midwayjs/core';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@midwayjs/swagger';
import { ElasticsearchService } from '../service/elasticsearch.service';

@Controller('/log')
@ApiTags(['log'])
export class LogController {
  @Inject()
  elasticsearchService: ElasticsearchService;

  @Config('defaultProjectId')
  defaultProjectId: string;

  @Get('/search')
  @ApiOperation({ summary: '查询监控日志' })
  @ApiQuery({ name: 'userId', required: false, description: '用户编号' })
  @ApiQuery({ name: 'type', required: false, description: '日志类型：error, performance, behavior, api' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键字搜索' })
  @ApiQuery({ name: 'startTime', required: false, description: '开始时间（ISO格式）' })
  @ApiQuery({ name: 'endTime', required: false, description: '结束时间（ISO格式）' })
  @ApiQuery({ name: 'page', required: false, description: '页码，从1开始' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async search(@Query() query: any) {
    const {
      userId,
      type,
      keyword,
      startTime,
      endTime,
      page = 1,
      pageSize = 20,
    } = query;

    // 如果没有指定时间范围，默认查询最近7天，截止到当前时间
    let finalStartTime = startTime;
    let finalEndTime = endTime;
    
    if (!finalStartTime && !finalEndTime) {
      const now = new Date();
      finalEndTime = now.toISOString();
      finalStartTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // 确保时间格式正确（ISO格式）
    if (finalStartTime && !finalStartTime.includes('T')) {
      finalStartTime = new Date(finalStartTime).toISOString();
    }
    if (finalEndTime && !finalEndTime.includes('T')) {
      finalEndTime = new Date(finalEndTime).toISOString();
    }

    // 调试日志
    console.log('🔍 Log search params:', {
      projectId: this.defaultProjectId,
      userId,
      type,
      keyword,
      startTime: finalStartTime,
      endTime: finalEndTime,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      isConnected: this.elasticsearchService.isConnected(),
    });

    const result = await this.elasticsearchService.searchLogs({
      projectId: this.defaultProjectId,
      userId,
      type,
      keyword,
      startTime: finalStartTime,
      endTime: finalEndTime,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
    });

    console.log('📊 Log search result:', {
      total: result.total,
      hitsCount: result.hits.length,
      isConnected: this.elasticsearchService.isConnected(),
    });
    
    // 如果未连接，返回提示信息
    if (!this.elasticsearchService.isConnected()) {
      return {
        success: false,
        message: 'Elasticsearch 未连接，请检查 Elasticsearch 服务是否运行',
        data: {
          list: [],
          total: 0,
          page: parseInt(page) || 1,
          pageSize: parseInt(pageSize) || 20,
        },
      };
    }

    return {
      success: true,
      data: {
        list: result.hits,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  @Post('/test')
  @ApiOperation({ summary: '测试写入日志（用于测试）' })
  @ApiBody({ description: '测试日志数据' })
  async testWrite(@Body() body: any) {
    try {
      await this.elasticsearchService.writeLog({
        projectId: this.defaultProjectId,
        type: body.type || 'error',
        userId: body.userId || 'test-user',
        sessionId: body.sessionId || 'test-session',
        url: body.url || 'http://test.com',
        timestamp: new Date().toISOString(),
        message: body.message || 'Test log message',
        ...body,
      });

      return {
        success: true,
        message: '测试日志已写入',
      };
    } catch (error: any) {
      return {
        success: false,
        message: '写入失败: ' + (error.message || '未知错误'),
      };
    }
  }

  @Get('/stats')
  @ApiOperation({ summary: '获取日志统计信息（用于测试）' })
  async stats() {
    try {
      const client = (this.elasticsearchService as any).client;
      if (!client) {
        return {
          success: false,
          message: 'Elasticsearch 未连接',
        };
      }

      // 检查索引是否存在
      const indexExists = await client.indices.exists({ index: 'monitor-logs' });
      
      if (!indexExists) {
        return {
          success: true,
          data: {
            indexExists: false,
            documentCount: 0,
            message: '索引不存在',
          },
        };
      }

      // 获取文档数量
      const countResult = await client.count({ index: 'monitor-logs' });
      
      // 获取最近一条记录
      const searchResult = await client.search({
        index: 'monitor-logs',
        body: {
          query: { match_all: {} },
          size: 1,
          sort: [{ '@timestamp': { order: 'desc' } }],
        },
      });

      return {
        success: true,
        data: {
          indexExists: true,
          documentCount: countResult.count,
          isConnected: this.elasticsearchService.isConnected(),
          lastRecord: searchResult.hits.hits[0]?._source || null,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: '查询失败: ' + (error.message || '未知错误'),
        error: error.message,
      };
    }
  }
}
