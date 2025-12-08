<template>
  <div class="errors-page">
    <h2 class="page-title">错误监控</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card type-card total-type-card">
          <div class="stat-item">
            <div class="stat-icon-wrapper total-icon">
              <el-icon class="stat-icon"><Warning /></el-icon>
            </div>
            <div class="stat-value type">{{ statsData.total || 0 }}</div>
            <div class="stat-label">总错误数</div>
            <div class="stat-hint">
              <el-icon class="hint-icon"><InfoFilled /></el-icon>
              错误记录数
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8" v-for="(count, type) in statsData.typeStats" :key="type">
        <el-card class="stat-card type-card">
          <div class="stat-item">
            <div class="stat-value type">{{ count }}</div>
            <div class="stat-label">{{ getErrorTypeName(String(type)) }}</div>
            <div class="stat-hint">
              <el-icon class="hint-icon"><InfoFilled /></el-icon>
              发生次数
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 错误趋势图 -->
    <el-card class="chart-card">
      <template #header>
        <span>错误趋势（最近7天）</span>
      </template>
      <div ref="chartRef" style="height: 200px"></div>
    </el-card>

    <!-- 错误列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>错误列表</span>
          <div class="header-actions">
            <el-select v-model="filters.type" placeholder="错误类型" clearable style="width: 150px; margin-right: 10px">
              <el-option label="JavaScript错误" value="js" />
              <el-option label="资源错误" value="resource" />
              <el-option label="Promise错误" value="promise" />
              <el-option label="Svelte错误" value="svelte" />
              <el-option label="Vue错误" value="vue-error" />
              <el-option label="React错误" value="react-error-boundary" />
              <el-option label="小程序错误" value="miniprogram" />
            </el-select>
            <el-button type="primary" @click="loadErrors">刷新</el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="errorList" 
        v-loading="loading" 
        stripe
        :max-height="280"
        style="width: 100%"
      >
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getErrorTypeTag(row.type)">{{ getErrorTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="用户ID" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.userId || 'anonymous' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="错误信息" show-overflow-tooltip />
        <el-table-column prop="url" label="页面URL" show-overflow-tooltip />
        <el-table-column prop="count" label="发生次数" width="120" align="center">
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadErrors"
        @current-change="loadErrors"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 错误详情对话框 -->
    <el-dialog v-model="detailVisible" title="错误详情" width="800px">
      <div v-if="currentError" class="error-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="错误ID">{{ currentError.id }}</el-descriptions-item>
          <el-descriptions-item label="错误类型">
            <el-tag :type="getErrorTypeTag(currentError.type)">
              {{ getErrorTypeName(currentError.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2">
            {{ currentError.message }}
          </el-descriptions-item>
          <el-descriptions-item label="页面URL" :span="2">
            {{ currentError.url }}
          </el-descriptions-item>
          <el-descriptions-item label="用户代理" :span="2">
            {{ currentError.userAgent }}
          </el-descriptions-item>
          <el-descriptions-item label="发生时间" :span="2">
            {{ formatTime(currentError.timestamp) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider>错误堆栈</el-divider>
        <pre class="stack-trace">{{ currentError.stack || '无堆栈信息' }}</pre>
        
        <el-divider>用户信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentError.userId || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="会话ID">{{ currentError.sessionId || '未知' }}</el-descriptions-item>
        </el-descriptions>
        
        <template v-if="currentError.context">
          <el-divider>扩展信息</el-divider>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="平台" v-if="currentError.platform || currentError.context?.platform">
              {{ currentError.platform || currentError.context?.platform }}
            </el-descriptions-item>
            <el-descriptions-item label="应用名称" v-if="currentError.appName || currentError.context?.appName">
              {{ currentError.appName || currentError.context?.appName }}
            </el-descriptions-item>
            <el-descriptions-item label="渲染类型" v-if="currentError.context?.renderType">
              {{ currentError.context.renderType }}
            </el-descriptions-item>
            <el-descriptions-item label="组件名称" v-if="currentError.context?.component || currentError.context?.componentName">
              {{ currentError.context.component || currentError.context.componentName }}
            </el-descriptions-item>
            <el-descriptions-item label="是否离线" v-if="currentError.isOnline !== undefined">
              {{ currentError.isOnline ? '在线' : '离线' }}
            </el-descriptions-item>
            <el-descriptions-item label="是否PWA" v-if="currentError.isPWA !== undefined">
              {{ currentError.isPWA ? '是' : '否' }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { errorApi } from '../api'
import dayjs from 'dayjs'

const loading = ref(false)
const errorList = ref<any[]>([])
const statsData = ref<any>({})
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const filters = ref({
  type: ''
})

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const detailVisible = ref(false)
const currentError = ref<any>(null)

const getErrorTypeName = (type: string) => {
  const map: Record<string, string> = {
    js: 'JavaScript错误',
    resource: '资源错误',
    promise: 'Promise错误',
    angular: 'Angular错误',
    svelte: 'Svelte错误',
    'vue-error': 'Vue错误',
    'react-error-boundary': 'React错误',
    server: '服务端错误',
    'client-js': '客户端JS错误',
    'client-promise': '客户端Promise错误',
    // 小程序
    'alipay-miniprogram': '支付宝小程序',
    'baidu-miniprogram': '百度小程序',
    'douyin-miniprogram': '抖音小程序',
    'kuaishou-miniprogram': '快手小程序',
    // 多端框架
    'taro-weapp': 'Taro微信',
    'taro-alipay': 'Taro支付宝',
    'taro-h5': 'Taro H5',
    'uniapp-h5': 'Uni-app H5',
    'uniapp-mp-weixin': 'Uni-app微信',
    // 微前端
    'micro-frontend': '微前端错误',
    // 其他
    jquery: 'jQuery错误',
    'web-component': 'Web组件错误',
    pwa: 'PWA错误',
    'sw-error': 'ServiceWorker错误'
  }
  return map[type] || type
}

const getErrorTypeTag = (type: string) => {
  const map: Record<string, string> = {
    js: 'danger',
    resource: 'warning',
    promise: 'info',
    angular: 'danger',
    svelte: 'danger',
    'vue-error': 'danger',
    'react-error-boundary': 'danger',
    server: '',
    jquery: 'warning',
    'web-component': 'info',
    pwa: 'info',
    'micro-frontend': 'warning'
  }
  return map[type] || ''
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const loadErrors = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (filters.value.type) {
      params.type = filters.value.type
    }
    
    const res = await errorApi.getList(params)
    errorList.value = res.data.data
    pagination.value.total = res.data.total
  } catch (error) {
    console.error('加载错误列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await errorApi.getStats()
    statsData.value = res.data.data
    
    // 更新图表
    if (chart && res.data.data.timeStats) {
      const dates = Object.keys(res.data.data.timeStats)
      const values = Object.values(res.data.data.timeStats) as number[]
      chart.setOption({
        xAxis: { data: dates },
        series: [{ data: values }]
      })
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const viewDetail = async (error: any) => {
  try {
    const res = await errorApi.getDetail(error.id)
    currentError.value = res.data.data
    detailVisible.value = true
  } catch (error) {
    console.error('加载错误详情失败:', error)
  }
}

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [] }]
    })
  }
}

onMounted(() => {
  initChart()
  loadErrors()
  loadStats()
})
</script>

<style scoped>
.errors-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 600;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  position: relative;
  padding: 20px 10px;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-card {
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.type-card {
  background: #fff;
  border-left: 4px solid #409eff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.type-card:hover {
  border-left-color: #66b1ff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.total-type-card {
  border-left-color: #f56c6c;
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
}

.total-type-card:hover {
  border-left-color: #f78989;
}

.total-type-card .stat-value.type {
  color: #f56c6c;
}

.stat-icon-wrapper {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1);
  opacity: 1;
}

.total-icon {
  background: rgba(245, 108, 108, 0.1);
}

.total-icon .stat-icon {
  color: #f56c6c;
  font-size: 24px;
}

.stat-value {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  letter-spacing: -1px;
}

.stat-card:hover .stat-value {
  transform: scale(1.05);
}

.stat-value.total {
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-value.type {
  color: #409eff;
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -1px;
}

.stat-label {
  font-size: 15px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 6px;
}

.stat-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.hint-icon {
  font-size: 14px;
}

.chart-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 0;
}

.table-card :deep(.el-card__body) {
  padding: 12px;
}

.table-card :deep(.el-table) {
  font-size: 13px;
}

.table-card :deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-detail {
  max-height: 600px;
  overflow-y: auto;
}

.stack-trace {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-count-badge {
  font-weight: 600;
}

.error-count-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
  border-color: #f56c6c;
  font-weight: 600;
  font-size: 12px;
}
</style>

