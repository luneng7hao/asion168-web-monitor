import { Controller, Post, Inject, Config } from '@midwayjs/core';
import { ApiTags, ApiOperation } from '@midwayjs/swagger';
import { DataCleanupService } from '../service/data-cleanup.service';

@Controller('/data-cleanup')
@ApiTags(['data-cleanup'])
export class DataCleanupController {
  @Inject()
  dataCleanupService: DataCleanupService;

  @Config('defaultProjectId')
  defaultProjectId: string;

  @Post('/clear-all')
  @ApiOperation({ summary: '清除所有监控数据' })
  async clearAll() {
    try {
      await this.dataCleanupService.clearAllData(this.defaultProjectId);
      return { success: true, message: '所有监控数据已清除' };
    } catch (error) {
      console.error('Clear all data failed:', error);
      return { success: false, message: '清除数据失败: ' + error.message };
    }
  }
}

