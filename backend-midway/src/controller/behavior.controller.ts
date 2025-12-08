import { Controller, Get, Post, Inject, Body, Query, Config } from '@midwayjs/core';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@midwayjs/swagger';
import { BehaviorService } from '../service/behavior.service';
import { ElasticsearchService } from '../service/elasticsearch.service';

@Controller('/behavior')
@ApiTags(['behavior'])
export class BehaviorController {
  @Inject()
  behaviorService: BehaviorService;

  @Inject()
  elasticsearchService: ElasticsearchService;

  @Config('defaultProjectId')
  defaultProjectId: string;

  @Post('/report')
  @ApiOperation({ summary: '上报用户行为数据' })
  @ApiBody({ description: '用户行为数据' })
  async report(@Body() body: any) {
    return this.handleReport(body);
  }

  @Get('/report')
  @ApiOperation({ summary: '上报用户行为数据（GET方式，用于img上报）' })
  @ApiQuery({ name: 'data', required: true, description: 'JSON编码的行为数据' })
  async reportGet(@Query('data') dataStr: string) {
    try {
      const body = JSON.parse(decodeURIComponent(dataStr));
      return this.handleReport(body);
    } catch (error) {
      console.error('Behavior report GET failed:', error);
      return { success: false, message: '数据解析失败' };
    }
  }

  private async handleReport(body: any) {
    try {
      // 调试日志：记录路由变化和自定义事件的 userId
      if (body.type === 'route-change' || body.type === 'custom') {
        console.log(`📊 ${body.type} event - userId: ${body.userId || 'undefined'}, sessionId: ${body.sessionId || 'undefined'}`);
      }
      
      await this.behaviorService.report({
        projectId: this.defaultProjectId,
        type: body.type || 'pv',
        url: body.url || '',
        path: body.path,
        userId: body.userId,
        sessionId: body.sessionId,
        data: body.data, // 传递详细数据
      });

      // 异步写入 Elasticsearch（不阻塞主流程）
      this.elasticsearchService.writeLog({
        projectId: this.defaultProjectId,
        type: 'behavior',
        userId: body.userId,
        sessionId: body.sessionId,
        url: body.url || '',
        path: body.path,
        timestamp: body.timestamp || new Date().toISOString(),
        behaviorType: body.type || 'pv',
        message: body.type === 'route-change' 
          ? `Route change: ${body.data?.from || ''} -> ${body.data?.to || ''}`
          : body.type === 'custom'
          ? `Custom event: ${body.data?.eventName || ''}`
          : body.type || 'pv',
        ...body.data,
      }).catch((err) => {
        // Elasticsearch 写入失败不影响主流程，只记录错误
        console.warn('⚠️ Elasticsearch write failed (non-blocking):', err.message);
      });

      return { success: true };
    } catch (error) {
      console.error('Behavior report failed:', error);
      return { success: false, message: '上报失败' };
    }
  }

  @Get('/stats')
  @ApiOperation({ summary: '获取用户行为统计' })
  @ApiQuery({ name: 'type', required: false, description: '行为类型：pv, click, route-change, custom' })
  async stats(@Query('type') type?: string) {
    const stats = await this.behaviorService.getStats(this.defaultProjectId, type);
    return { success: true, data: stats };
  }

  @Get('/events')
  @ApiOperation({ summary: '获取行为事件详情列表（点击事件和自定义事件）' })
  @ApiQuery({ name: 'type', required: false, description: '行为类型：click, custom' })
  @ApiQuery({ name: 'page', required: false, description: '页码，从1开始' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getEvents(
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    const events = await this.behaviorService.getEvents(
      this.defaultProjectId,
      type,
      page || 1,
      pageSize || 20
    );
    return { success: true, data: events };
  }
}

