import { Controller, Get, Post, Inject, Body, Query, Config } from '@midwayjs/core';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@midwayjs/swagger';
import { PerformanceService } from '../service/performance.service';
import { ElasticsearchService } from '../service/elasticsearch.service';
import { formatDateTime } from '../utils/date.util';

@Controller('/performance')
@ApiTags(['performance'])
export class PerformanceController {
  @Inject()
  performanceService: PerformanceService;

  @Inject()
  elasticsearchService: ElasticsearchService;

  @Config('defaultProjectId')
  defaultProjectId: string;

  @Post('/report')
  @ApiOperation({ summary: '上报性能数据' })
  @ApiBody({ description: '性能指标数据' })
  async report(@Body() body: any) {
    return this.handleReport(body);
  }

  @Get('/report')
  @ApiOperation({ summary: '上报性能数据（GET方式，用于img上报）' })
  @ApiQuery({ name: 'data', required: true, description: 'JSON编码的性能数据' })
  async reportGet(@Query('data') dataStr: string) {
    try {
      const body = JSON.parse(decodeURIComponent(dataStr));
      return this.handleReport(body);
    } catch (error) {
      console.error('Performance report GET failed:', error);
      return { success: false, message: '数据解析失败' };
    }
  }

  private async handleReport(body: any) {
    try {
      await this.performanceService.report({
        projectId: this.defaultProjectId,
        url: body.url || '',
        userId: body.userId,
        sessionId: body.sessionId,
        loadTime: body.loadTime || 0,
        domReady: body.domReady,
        fcp: body.fcp,
        lcp: body.lcp,
        fid: body.fid,
        cls: body.cls,
        dns: body.dns,
        tcp: body.tcp,
        ttfb: body.ttfb,
      });

      // 异步写入 Elasticsearch（不阻塞主流程）
      this.elasticsearchService.writeLog({
        projectId: this.defaultProjectId,
        type: 'performance',
        userId: body.userId,
        sessionId: body.sessionId,
        url: body.url || '',
        timestamp: body.timestamp || new Date().toISOString(),
        loadTime: body.loadTime || 0,
        domReady: body.domReady,
        fcp: body.fcp,
        lcp: body.lcp,
        fid: body.fid,
        cls: body.cls,
        dns: body.dns,
        tcp: body.tcp,
        ttfb: body.ttfb,
        message: `Performance metrics: loadTime=${body.loadTime || 0}ms`,
      }).catch((err) => {
        // Elasticsearch 写入失败不影响主流程，只记录错误
        console.warn('⚠️ Elasticsearch write failed (non-blocking):', err.message);
      });

      return { success: true };
    } catch (error) {
      console.error('Performance report failed:', error);
      return { success: false, message: '上报失败' };
    }
  }

  @Get('/list')
  @ApiOperation({ summary: '获取性能数据列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数' })
  async list(@Query() query: any) {
    const { page, pageSize } = query;

    const result = await this.performanceService.getList({
      projectId: this.defaultProjectId,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
    });

    return {
      success: true,
      data: result.data.map(item => ({
        ...item,
        timestamp: formatDateTime(item.timestamp),
      })),
      total: result.total,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
    };
  }

  @Get('/stats')
  @ApiOperation({ summary: '获取性能统计' })
  async stats() {
    const stats = await this.performanceService.getStats(this.defaultProjectId);
    return { success: true, data: stats };
  }
}

