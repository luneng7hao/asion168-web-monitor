<template>
  <div class="logs-page">
    <div class="page-header">
      <h2 class="page-title">监控日志中心</h2>
      <p class="page-subtitle">综合查询错误监控、用户行为、接口监控等所有类型的监控记录</p>
    </div>

    <!-- 查询条件 -->
    <el-card class="filter-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="用户编号">
          <el-input
            v-model="queryForm.userId"
            placeholder="请输入用户编号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="监控类型">
          <el-select
            v-model="queryForm.type"
            placeholder="全部类型"
            clearable
            style="width: 200px"
          >
            <el-option label="全部类型" value="" />
            <el-option label="错误监控" value="error">
              <span style="float: left">错误监控</span>
              <span style="float: right; color: #8492a6; font-size: 13px">JS、Promise、资源错误</span>
            </el-option>
            <el-option label="用户行为" value="behavior">
              <span style="float: left">用户行为</span>
              <span style="float: right; color: #8492a6; font-size: 13px">PV、点击、路由变化</span>
            </el-option>
            <el-option label="接口监控" value="api">
              <span style="float: left">接口监控</span>
              <span style="float: right; color: #8492a6; font-size: 13px">API请求、响应</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input
            v-model="queryForm.keyword"
            placeholder="搜索消息、URL、堆栈等"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
            style="width: 400px"
            :default-time="[
              new Date(2000, 1, 1, 0, 0, 0),
              new Date(2000, 1, 1, 23, 59, 59)
            ]"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="24">
        <el-card>
          <div class="stat-info">
            <span v-if="total > 0">共找到 <strong>{{ total }}</strong> 条监控记录</span>
            <span v-else style="color: #909399">暂无监控记录，请调整查询条件或等待数据上报</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 监控记录列表 -->
    <el-card class="table-card">
      <el-table
        :data="logList"
        v-loading="loading"
        stripe
        style="width: 100%"
        :max-height="600"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="用户编号" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.userId || 'anonymous' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row['@timestamp'] || row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="url" label="URL" min-width="200" show-overflow-tooltip />
        <el-table-column prop="message" label="消息" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span :title="row.message || row.errorMessage || '-'">
              {{ row.message || row.errorMessage || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="showDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="`监控记录详情 - ${getTypeLabel(currentLog?.type || '')}`"
      width="800px"
      destroy-on-close
    >
      <div v-if="currentLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">
            {{ currentLog._id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getTypeTagType(currentLog.type)" size="small">
              {{ getTypeLabel(currentLog.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户编号">
            {{ currentLog.userId || 'anonymous' }}
          </el-descriptions-item>
          <el-descriptions-item label="会话ID">
            {{ currentLog.sessionId || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="时间" :span="2">
            {{ formatTime(currentLog['@timestamp'] || currentLog.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="URL" :span="2">
            <span class="text-ellipsis">{{ currentLog.url || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="路径" :span="2">
            {{ currentLog.path || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 错误相关 -->
        <div v-if="currentLog.type === 'error'" class="detail-section">
          <h4>错误信息</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="错误类型">
              {{ currentLog.errorType || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="错误消息">
              {{ currentLog.errorMessage || currentLog.message || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="行号">
              {{ currentLog.line || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="列号">
              {{ currentLog.col || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="堆栈信息" v-if="currentLog.stack">
              <pre class="stack-trace">{{ currentLog.stack }}</pre>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 性能相关 -->
        <div v-if="currentLog.type === 'performance'" class="detail-section">
          <h4>性能指标</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="加载时间">
              {{ currentLog.loadTime || 0 }}ms
            </el-descriptions-item>
            <el-descriptions-item label="FCP">
              {{ currentLog.fcp ? currentLog.fcp.toFixed(2) : '-' }}ms
            </el-descriptions-item>
            <el-descriptions-item label="LCP">
              {{ currentLog.lcp ? currentLog.lcp.toFixed(2) : '-' }}ms
            </el-descriptions-item>
            <el-descriptions-item label="FID">
              {{ currentLog.fid ? currentLog.fid.toFixed(2) : '-' }}ms
            </el-descriptions-item>
            <el-descriptions-item label="CLS">
              {{ currentLog.cls ? currentLog.cls.toFixed(4) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 行为相关 -->
        <div v-if="currentLog.type === 'behavior'" class="detail-section">
          <h4>行为信息</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="行为类型">
              {{ currentLog.behaviorType || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="消息">
              {{ currentLog.message || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- API相关 -->
        <div v-if="currentLog.type === 'api'" class="detail-section">
          <h4>接口信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="请求方法">
              <el-tag :type="getMethodTagType(currentLog.method)">
                {{ currentLog.method || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态码">
              <el-tag :type="getStatusTagType(currentLog.status)">
                {{ currentLog.status || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="响应时间">
              {{ currentLog.responseTime || 0 }}ms
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 原始数据 -->
        <div class="detail-section">
          <h4>原始数据</h4>
          <div class="raw-data">
            <pre>{{ JSON.stringify(currentLog.rawData || currentLog, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { logApi } from '../api'
import dayjs from 'dayjs'

const loading = ref(false)
const logList = ref<any[]>([])
const total = ref(0)
const detailVisible = ref(false)
const currentLog = ref<any>(null)
const timeRange = ref<[string, string] | null>(null)

const queryForm = reactive({
  userId: '',
  type: '',
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
})

// 获取类型标签
const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    error: '错误',
    performance: '性能',
    behavior: '行为',
    api: '接口',
  }
  return map[type] || type
}

const getTypeTagType = (type: string) => {
  const map: Record<string, string> = {
    error: 'danger',
    performance: 'success',
    behavior: 'primary',
    api: 'warning',
  }
  return map[type] || 'info'
}

const getMethodTagType = (method: string) => {
  const map: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
  }
  return map[method] || 'info'
}

const getStatusTagType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400) return 'danger'
  return 'info'
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 获取北京时间的 dayjs 对象（UTC+8）
const getBeijingTime = () => {
  const now = new Date()
  // 获取北京时间（UTC+8）
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return dayjs(beijingTime)
}

// 搜索
const handleSearch = async () => {
  loading.value = true
  try {
    const params: any = {
      ...queryForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }

    if (timeRange.value && timeRange.value.length === 2) {
      // 确保时间格式正确（ISO 格式）
      params.startTime = timeRange.value[0]
      params.endTime = timeRange.value[1]
    } else {
      // 如果没有选择时间范围，使用默认的最近7天，截止到当前北京时间
      const beijingNow = getBeijingTime()
      const endTime = beijingNow.toISOString()
      const startTime = beijingNow.subtract(7, 'day').toISOString()
      params.startTime = startTime
      params.endTime = endTime
    }

    // 排除性能监控类型（不查询性能监控）
    if (params.type === 'performance') {
      delete params.type
    }

    // 清理空值（但保留时间参数）
    Object.keys(params).forEach(key => {
      if (key !== 'startTime' && key !== 'endTime' && 
          (params[key] === '' || params[key] === null || params[key] === undefined)) {
        delete params[key]
      }
    })

    const res = await logApi.search(params)
    if (res.data.success) {
      logList.value = res.data.data.list
      total.value = res.data.data.total
    } else {
      ElMessage.error('查询失败')
    }
  } catch (error: any) {
    ElMessage.error('查询失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 重置到默认值（最近7天，使用北京时间）
const resetToDefaultTimeRange = () => {
  const beijingNow = getBeijingTime()
  const endTime = beijingNow.toISOString()
  const startTime = beijingNow.subtract(7, 'day').toISOString()
  timeRange.value = [startTime, endTime]
}

// 重置
const handleReset = () => {
  queryForm.userId = ''
  queryForm.type = ''
  queryForm.keyword = ''
  resetToDefaultTimeRange() // 重置为默认的最近7天
  pagination.page = 1
  pagination.pageSize = 20
  // 重置后自动查询
  handleSearch()
}

// 分页
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  handleSearch()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  handleSearch()
}

// 显示详情
const showDetail = (row: any) => {
  currentLog.value = row
  detailVisible.value = true
}

onMounted(() => {
  // 默认查询最近7天的数据，截止到当前时间
  resetToDefaultTimeRange()
  // 延迟执行搜索，确保日期选择器已初始化
  setTimeout(() => {
    handleSearch()
  }, 100)
})
</script>

<style scoped>
.logs-page {
  padding: 0;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-info {
  font-size: 14px;
}

.stat-info strong {
  color: #409eff;
  font-size: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.log-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.raw-data {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.raw-data pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
}

.stack-trace {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.text-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

