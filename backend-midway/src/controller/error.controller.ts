import { Controller, Get, Post, Inject, Body, Param, Query, Config } from '@midwayjs/core';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@midwayjs/swagger';
import { ErrorService } from '../service/error.service';
import { ElasticsearchService } from '../service/elasticsearch.service';
import { formatDateTime } from '../utils/date.util';

@Controller('/error')
@ApiTags(['error'])
export class ErrorController {
  @Inject()
  errorService: ErrorService;

  @Inject()
  elasticsearchService: ElasticsearchService;

  @Config('defaultProjectId')
  defaultProjectId: string;

  @Post('/report')
  @ApiOperation({ summary: '上报错误数据' })
  @ApiBody({ description: '错误信息' })
  async report(@Body() body: any) {
    return this.handleReport(body);
  }

  @Get('/report')
  @ApiOperation({ summary: '上报错误数据（GET方式，用于img上报）' })
  @ApiQuery({ name: 'data', required: true, description: 'JSON编码的错误信息' })
  async reportGet(@Query('data') dataStr: string) {
    try {
      const body = JSON.parse(decodeURIComponent(dataStr));
      return this.handleReport(body);
    } catch (error) {
      console.error('Error report GET failed:', error);
      return { success: false, message: '数据解析失败' };
    }
  }

  private async handleReport(body: any) {
    try {
      // 调试日志：记录接收到的错误信息
      if (body.type === 'resource') {
        console.log('📦 Resource error received:', {
          type: body.type,
          message: body.message,
          url: body.url,
          userId: body.userId
        });
      }
      
      const error = await this.errorService.report({
        projectId: this.defaultProjectId,
        type: body.type || 'js',
        message: body.message || 'Unknown error',
        stack: body.stack,
        url: body.url,
        line: body.line,
        col: body.col,
        userAgent: body.userAgent,
        userId: body.userId,
        sessionId: body.sessionId,
      });

      if (body.type === 'resource') {
        console.log('✅ Resource error saved:', error._id);
      }

      // 异步写入 Elasticsearch（不阻塞主流程）
      this.elasticsearchService.writeLog({
        projectId: this.defaultProjectId,
        type: 'error',
        userId: body.userId,
        sessionId: body.sessionId,
        url: body.url,
        timestamp: new Date().toISOString(),
        errorType: body.type || 'js',
        errorMessage: body.message || 'Unknown error',
        stack: body.stack,
        line: body.line,
        col: body.col,
        userAgent: body.userAgent,
        message: body.message || 'Unknown error',
      }).catch((err) => {
        // Elasticsearch 写入失败不影响主流程，只记录错误
        console.warn('⚠️ Elasticsearch write failed (non-blocking):', err.message);
      });

      return { success: true, id: error._id };
    } catch (error) {
      console.error('Error report failed:', error);
      return { success: false, message: '上报失败' };
    }
  }

  @Get('/list')
  @ApiOperation({ summary: '获取错误列表' })
  @ApiQuery({ name: 'type', required: false, description: '错误类型' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数' })
  async list(@Query() query: any) {
    const { type, page, pageSize, startTime, endTime } = query;

    const result = await this.errorService.findList({
      projectId: this.defaultProjectId,
      type,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      startTime,
      endTime,
    });

    return {
      success: true,
      data: result.data.map(e => {
        const errorData = (e as any).toObject ? (e as any).toObject() : e;
        return {
          id: errorData._id?.toString() || errorData.id,
          type: errorData.type,
          message: errorData.message,
          url: errorData.url,
          userId: errorData.userId || 'anonymous',
          timestamp: formatDateTime(errorData.timestamp),
          count: errorData.count,
          firstSeen: formatDateTime(errorData.firstSeen),
          lastSeen: formatDateTime(errorData.lastSeen),
          affectedUsers: errorData.affectedUsers,
        };
      }),
      total: result.total,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
    };
  }

  @Get('/detail/:id')
  @ApiOperation({ summary: '获取错误详情' })
  @ApiParam({ name: 'id', description: '错误ID' })
  async detail(@Param('id') id: string) {
    const error = await this.errorService.findById(id);
    if (!error) {
      return { success: false, message: '错误不存在' };
    }
    // 将 MongoDB 文档转换为普通对象，确保所有字段都被包含
    // Typegoose 返回的文档可能有 toObject 方法，但类型定义中可能没有
    const errorData = (error as any).toObject ? (error as any).toObject() : error;
    return { 
      success: true, 
      data: {
        id: errorData._id?.toString() || errorData.id,
        type: errorData.type,
        message: errorData.message,
        stack: errorData.stack,
        url: errorData.url,
        line: errorData.line,
        col: errorData.col,
        userAgent: errorData.userAgent,
        userId: errorData.userId,
        sessionId: errorData.sessionId,
        timestamp: formatDateTime(errorData.timestamp),
        firstSeen: formatDateTime(errorData.firstSeen),
        lastSeen: formatDateTime(errorData.lastSeen),
        count: errorData.count,
        affectedUsers: errorData.affectedUsers,
        context: errorData.context,
        platform: errorData.platform,
        appName: errorData.appName,
        isOnline: errorData.isOnline,
        isPWA: errorData.isPWA,
      }
    };
  }

  @Get('/stats')
  @ApiOperation({ summary: '获取错误统计' })
  async stats() {
    const stats = await this.errorService.getStats(this.defaultProjectId);
    return { success: true, data: stats };
  }
}

