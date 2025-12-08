<template>
  <div class="api-page">
    <h2 class="page-title">接口监控</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4.8" v-for="(stat, index) in apiStats" :key="index">
        <el-card :class="['stat-card', stat.className]">
          <div class="stat-item">
            <div v-if="stat.icon" class="stat-icon-wrapper" :class="stat.iconClass">
              <el-icon class="stat-icon"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-value" :class="stat.valueClass">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 成功率趋势图 -->
    <el-card class="chart-card">
      <template #header>
        <span>接口成功率趋势（最近7天）</span>
      </template>
      <div ref="chartRef" style="height: 200px"></div>
    </el-card>

    <!-- 热门接口 -->
    <el-card class="table-card">
      <template #header>
        <span>热门接口</span>
      </template>
      
      <el-table 
        :data="statsData.topApis || []" 
        stripe
        :max-height="280"
        style="width: 100%"
      >
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="url" label="接口URL" show-overflow-tooltip min-width="200" />
        <el-table-column prop="userId" label="用户ID" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.userId || 'anonymous' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total" label="总请求" width="100" align="center">
          <template #default="{ row }">
            <span class="stat-number">{{ row.total || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="success" label="成功" width="120" align="center">
          <template #default="{ row }">
            <div class="status-cell success-cell">
             
              <el-tag type="success" size="small">{{ row.success || 0 }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="error" label="失败" width="120" align="center">
          <template #default="{ row }">
            <div class="status-cell error-cell">
              
              <el-tag type="danger" size="small">{{ row.error || 0 }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成功率" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSuccessRateType(row)" 
              size="small"
              effect="dark"
            >
              {{ getSuccessRate(row) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgResponseTime" label="平均响应时间" width="140" align="center">
          <template #default="{ row }">
            <span class="response-time">{{ row.avgResponseTime || 0 }}ms</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" v-if="statsData.topApis?.some((api: any) => api.error > 0)">
          <template #default="{ row }">
            <el-button 
              v-if="row.error > 0" 
              type="primary" 
              size="small" 
              link
              @click="viewErrorDetails(row)"
            >
              查看错误
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 错误详情对话框 -->
    <el-dialog v-model="errorDetailVisible" title="接口错误详情" width="900px">
      <div v-if="currentErrorApi" class="error-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="接口URL" :span="2">
            <span style="word-break: break-all;">{{ currentErrorApi.url }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="请求方法">
            <el-tag>{{ currentErrorApi.method || 'GET' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="失败次数">
            <el-tag type="danger">{{ currentErrorApi.error }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总请求数">
            {{ currentErrorApi.total }}
          </el-descriptions-item>
          <el-descriptions-item label="成功率">
            <el-tag :type="getSuccessRateType(currentErrorApi)">
              {{ getSuccessRate(currentErrorApi) }}%
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider>错误请求详情</el-divider>
        <el-table 
          :data="errorDetails" 
          stripe
          v-loading="errorDetailsLoading"
          :max-height="400"
          style="width: 100%"
        >
          <el-table-column prop="time" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.time) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态码" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status >= 400 ? 'danger' : 'warning'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responseTime" label="响应时间" width="120" align="center">
            <template #default="{ row }">
              {{ row.responseTime }}ms
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                link
                @click="viewRequestDetail(row)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 请求详情对话框 -->
    <el-dialog v-model="requestDetailVisible" title="请求详情" width="800px">
      <div v-if="currentRequest" class="request-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="请求URL">
            <span style="word-break: break-all;">{{ currentRequest.url }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="请求方法">
            <el-tag>{{ currentRequest.method || 'GET' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态码">
            <el-tag :type="currentRequest.status >= 400 ? 'danger' : 'warning'">
              {{ currentRequest.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="响应时间">
            {{ currentRequest.responseTime }}ms
          </el-descriptions-item>
          <el-descriptions-item label="请求时间">
            {{ formatTime(currentRequest.time) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider>请求参数</el-divider>
        <pre class="code-block" v-if="currentRequest.requestData">{{ formatJson(currentRequest.requestData) }}</pre>
        <el-empty v-else description="无请求参数" :image-size="80" />
        
        <el-divider>响应数据</el-divider>
        <pre class="code-block" v-if="currentRequest.responseData">{{ formatJson(currentRequest.responseData) }}</pre>
        <el-empty v-else description="无响应数据" :image-size="80" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { Check, Close, Connection } from '@element-plus/icons-vue'
import { apiMonitorApi } from '../api'
import dayjs from 'dayjs'

const statsData = ref<any>({})
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 错误详情相关
const errorDetailVisible = ref(false)
const requestDetailVisible = ref(false)
const currentErrorApi = ref<any>(null)
const currentRequest = ref<any>(null)
const errorDetails = ref<any[]>([])
const errorDetailsLoading = ref(false)

// 计算统计卡片数据
const apiStats = computed(() => [
  {
    value: statsData.value.total || 0,
    label: '总请求数',
    icon: Connection,
    className: '',
    iconClass: '',
    valueClass: ''
  },
  {
    value: statsData.value.success || 0,
    label: '成功请求',
    icon: Check,
    className: 'success-card',
    iconClass: 'success-icon',
    valueClass: 'success'
  },
  {
    value: statsData.value.error || 0,
    label: '失败请求',
    icon: Close,
    className: 'error-card',
    iconClass: 'error-icon',
    valueClass: 'error'
  },
  {
    value: `${statsData.value.successRate || 0}%`,
    label: '成功率',
    icon: null,
    className: 'rate-card',
    iconClass: '',
    valueClass: 'rate'
  },
  {
    value: `${statsData.value.avgResponseTime || 0}ms`,
    label: '平均响应时间',
    icon: null,
    className: 'time-card',
    iconClass: '',
    valueClass: 'time'
  }
])

const loadStats = async () => {
  try {
    const res = await apiMonitorApi.getStats()
    statsData.value = res.data.data
    
    // 更新图表
    if (chart && res.data.data.timeStats) {
      const dates = Object.keys(res.data.data.timeStats)
      const successRates = Object.values(res.data.data.timeStats).map((s: any) => {
        return s.total > 0 ? ((s.success / s.total) * 100).toFixed(2) : 0
      })
      
      chart.setOption({
        tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
        xAxis: { type: 'category', data: dates },
        yAxis: { type: 'value', name: '%', max: 100 },
        series: [{ type: 'line', smooth: true, data: successRates, name: '成功率' }]
      })
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', name: '%', max: 100 },
      series: [{ type: 'line', smooth: true, data: [] }]
    })
  }
}

const viewErrorDetails = async (api: any) => {
  currentErrorApi.value = api
  errorDetailVisible.value = true
  errorDetailsLoading.value = true
  
  try {
    const res = await apiMonitorApi.getErrorDetails({
      url: api.url,
      method: api.method || 'GET'
    })
    errorDetails.value = res.data.data || []
  } catch (error) {
    console.error('加载错误详情失败:', error)
    errorDetails.value = []
  } finally {
    errorDetailsLoading.value = false
  }
}

const viewRequestDetail = (request: any) => {
  currentRequest.value = request
  requestDetailVisible.value = true
}

const formatTime = (time: string | Date) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const formatJson = (jsonStr: string | object) => {
  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return String(jsonStr)
  }
}

onMounted(() => {
  initChart()
  loadStats()
})

// 计算成功率
const getSuccessRate = (row: any) => {
  const total = row.total || 0
  if (total === 0) return '0.00'
  const success = row.success || 0
  return ((success / total) * 100).toFixed(2)
}

// 根据成功率返回标签类型
const getSuccessRateType = (row: any) => {
  const rateStr = getSuccessRate(row)
  const rate = parseFloat(rateStr)
  if (rate >= 95) return 'success'
  if (rate >= 80) return 'warning'
  return 'danger'
}
</script>

<style scoped>
.api-page {
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
  margin-left: 0 !important;
  margin-right: 0 !important;
  
}

.stats-row :deep(.el-col) {
  padding-left: 8px !important;
  padding-right: 8px !important;
  width: 20%;
}

.stat-item {
  text-align: center;
  position: relative;
  padding: 20px 10px;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1);
}

.stat-icon {
  font-size: 20px;
}

.success-icon {
  background: rgba(103, 194, 58, 0.1);
}

.success-icon .stat-icon {
  color: #67c23a;
}

.error-icon {
  background: rgba(245, 108, 108, 0.1);
}

.error-icon .stat-icon {
  color: #f56c6c;
}

.stat-card {
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  height: 100%;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: #fff;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.success-card {
  border-left: 4px solid #67c23a;
  background: linear-gradient(135deg, #fff 0%, #f0f9ff 100%);
}

.success-card:hover {
  border-left-color: #85ce61;
  border-left-width: 5px;
}

.error-card {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
}

.error-card:hover {
  border-left-color: #f78989;
  border-left-width: 5px;
}

.rate-card {
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #fff 0%, #ecf5ff 100%);
}

.rate-card:hover {
  border-left-color: #66b1ff;
  border-left-width: 5px;
}

.time-card {
  border-left: 4px solid #e6a23c;
  background: linear-gradient(135deg, #fff 0%, #fdf6ec 100%);
}

.time-card:hover {
  border-left-color: #ebb563;
  border-left-width: 5px;
}

.time-icon {
  background: rgba(230, 162, 60, 0.1);
}

.time-icon .stat-icon {
  color: #e6a23c;
}

.stat-value.rate {
  color: #409eff;
}

.stat-value.time {
  color: #e6a23c;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #409eff;
  letter-spacing: -1px;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-value {
  transform: scale(1.05);
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.error {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-top: 4px;
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

.stat-number {
  font-weight: 600;
  color: #409eff;
}

.status-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.status-icon {
  font-size: 16px;
}

.success-cell .status-icon {
  color: #67c23a;
}

.error-cell .status-icon {
  color: #f56c6c;
}

.response-time {
  font-weight: 500;
  color: #606266;
}
</style>

