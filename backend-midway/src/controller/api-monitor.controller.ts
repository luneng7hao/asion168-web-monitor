import { Controller, Get, Post, Inject, Body, Query, Config } from '@midwayjs/core';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@midwayjs/swagger';
import { ApiMonitorService } from '../service/api-monitor.service';
import { ElasticsearchService } from '../service/elasticsearch.service';

@Controller('/api')
@ApiTags(['api'])
export class ApiMonitorController {
  @Inject()
  apiMonitorService: ApiMonitorService;

  @Inject()
  elasticsearchService: ElasticsearchService;

  @Config('defaultProjectId')
  defaultProjectId: string;

  @Post('/report')
  @ApiOperation({ summary: '上报接口监控数据' })
  @ApiBody({ description: '接口调用数据' })
  async report(@Body() body: any) {
    return this.handleReport(body);
  }

  @Get('/report')
  @ApiOperation({ summary: '上报接口监控数据（GET方式，用于img上报）' })
  @ApiQuery({ name: 'data', required: true, description: 'JSON编码的接口数据' })
  async reportGet(@Query('data') dataStr: string) {
    try {
      const body = JSON.parse(decodeURIComponent(dataStr));
      return this.handleReport(body);
    } catch (error) {
      console.error('API monitor report GET failed:', error);
      return { success: false, message: '数据解析失败' };
    }
  }

  private async handleReport(body: any) {
    try {
      // 调试日志：记录接收到的数据
      if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development') {
        console.log('📥 API monitor report received:', {
          projectId: body.projectId,
          defaultProjectId: this.defaultProjectId,
          url: body.url,
          method: body.method,
          status: body.status,
          userId: body.userId,
          sessionId: body.sessionId
        });
      }
      
      await this.apiMonitorService.report({
        projectId: this.defaultProjectId,
        url: body.url || '',
        method: body.method || 'GET',
        status: body.status || 0,
        responseTime: body.responseTime || 0,
        userId: body.userId,
        sessionId: body.sessionId,
        requestData: body.requestData,
        responseData: body.responseData,
      });
      
      // 调试日志：记录数据上报成功
      if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development') {
        console.log('✅ API monitor report saved successfully');
      }

      // 异步写入 Elasticsearch（不阻塞主流程）
      this.elasticsearchService.writeLog({
        projectId: this.defaultProjectId,
        type: 'api',
        userId: body.userId,
        sessionId: body.sessionId,
        url: body.url || '',
        timestamp: body.timestamp || new Date().toISOString(),
        method: body.method || 'GET',
        status: body.status || 0,
        responseTime: body.responseTime || 0,
        message: `${body.method || 'GET'} ${body.url || ''} - ${body.status || 0} (${body.responseTime || 0}ms)`,
        requestData: body.requestData,
        responseData: body.responseData,
      }).catch((err) => {
        // Elasticsearch 写入失败不影响主流程，只记录错误
        console.warn('⚠️ Elasticsearch write failed (non-blocking):', err.message);
      });

      return { success: true };
    } catch (error) {
      console.error('API monitor report failed:', error);
      return { success: false, message: '上报失败' };
    }
  }

  @Get('/stats')
  @ApiOperation({ summary: '获取接口监控统计' })
  async stats() {
    const stats = await this.apiMonitorService.getStats(this.defaultProjectId);
    return { success: true, data: stats };
  }

  @Get('/errors')
  @ApiOperation({ summary: '获取接口错误详情' })
  @ApiQuery({ name: 'url', required: true, description: '接口URL' })
  @ApiQuery({ name: 'method', required: false, description: '请求方法，默认GET' })
  async getErrorDetails(@Query('url') url: string, @Query('method') method: string = 'GET') {
    const errors = await this.apiMonitorService.getErrorDetails(
      this.defaultProjectId,
      url,
      method
    );
    return { success: true, data: errors };
  }
}

