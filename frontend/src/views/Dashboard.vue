<template>
  <div class="dashboard">
    <h2 class="page-title">数据概览</h2>
    
    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <el-card class="metric-card error-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon :size="40"><Warning /></el-icon>
            </div>
            <div class="metric-info">
              <div class="error-main-info">
                <div class="metric-value">{{ overviewData.errors?.today || 0 }}</div>
                <div class="error-label-trend">
                  <span class="metric-label">今日错误</span>
                </div>
              </div>
              <div class="error-type-stats" v-if="overviewData.errors?.today > 0">
                <div class="error-type-item">
                  <span class="error-type-label">JS:</span>
                  <span class="error-type-value">
                    {{ getErrorTypePercent('js') }}% <span class="error-type-count">({{ getErrorTypeCount('js') }})</span>
                  </span>
                </div>
                <div class="error-type-item">
                  <span class="error-type-label">Promise:</span>
                  <span class="error-type-value">
                    {{ getErrorTypePercent('promise') }}% <span class="error-type-count">({{ getErrorTypeCount('promise') }})</span>
                  </span>
                </div>
              </div>
              <!-- 调试信息（开发时可见） -->
              <div v-if="false" style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 4px;">
                Debug: today={{ overviewData.errors?.today }}, 
                typeStats={{ JSON.stringify(overviewData.errors?.typeStats) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card performance-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon :size="40"><Timer /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ overviewData.performance?.avgLoadTime || 0 }}ms</div>
              <div class="metric-label">平均加载时间</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card behavior-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon :size="40"><User /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ overviewData.behavior?.todayPV || 0 }}</div>
              <div class="metric-label">今日 PV</div>
              <div class="metric-sub">{{ overviewData.behavior?.todayUV || 0 }} UV</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card api-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon :size="40"><Connection /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ overviewData.api?.successRate || 0 }}%</div>
              <div class="metric-label">接口成功率</div>
              <div class="metric-sub">{{ overviewData.api?.total || 0 }} 次请求</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>错误趋势</span>
          </template>
          <div ref="errorChartRef" style="height: 200px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>性能趋势</span>
          </template>
          <div ref="performanceChartRef" style="height: 200px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用户访问趋势</span>
          </template>
          <div ref="behaviorChartRef" style="height: 200px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>接口成功率趋势</span>
          </template>
          <div ref="apiChartRef" style="height: 200px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Warning, Timer, User, Connection } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { dashboardApi, errorApi, performanceApi, behaviorApi, apiMonitorApi } from '../api'

const overviewData = ref<any>({})
const errorChartRef = ref<HTMLElement>()
const performanceChartRef = ref<HTMLElement>()
const behaviorChartRef = ref<HTMLElement>()
const apiChartRef = ref<HTMLElement>()

let errorChart: echarts.ECharts | null = null
let performanceChart: echarts.ECharts | null = null
let behaviorChart: echarts.ECharts | null = null
let apiChart: echarts.ECharts | null = null
let timer: number | null = null

const loadData = async () => {
  try {
    const [overview, errorStats, perfStats, behaviorStats, apiStats] = await Promise.all([
      dashboardApi.getOverview(),
      errorApi.getStats(),
      performanceApi.getStats(),
      behaviorApi.getStats(),
      apiMonitorApi.getStats()
    ])
    
    // overview数据已经包含了今日错误类型统计
    overviewData.value = overview.data.data
    
    // 调试：打印数据
    console.log('Dashboard overview data:', {
      today: overviewData.value.errors?.today,
      typeStats: overviewData.value.errors?.typeStats,
      js: overviewData.value.errors?.typeStats?.['js'] || 0,
      promise: overviewData.value.errors?.typeStats?.['promise'] || 0
    })
    
    // 更新错误趋势图
    if (errorChart && errorStats.data.data.timeStats) {
      const dates = Object.keys(errorStats.data.data.timeStats)
      const values = Object.values(errorStats.data.data.timeStats) as number[]
      errorChart.setOption({
        xAxis: { data: dates },
        series: [{ data: values }]
      })
    }
    
    // 更新性能趋势图
    if (performanceChart && perfStats.data.data.timeStats) {
      const dates = Object.keys(perfStats.data.data.timeStats)
      const values = Object.values(perfStats.data.data.timeStats).map((s: any) => s.avgLoadTime)
      performanceChart.setOption({
        xAxis: { data: dates },
        series: [{ data: values }]
      })
    }
    
    // 更新用户访问趋势图
    if (behaviorChart && behaviorStats.data.data.timeStats) {
      const dates = Object.keys(behaviorStats.data.data.timeStats).sort()
      // 兼容新旧数据结构：新结构使用 count，旧结构使用 pv
      const pvData = Object.keys(behaviorStats.data.data.timeStats).sort().map((date) => {
        const stat = behaviorStats.data.data.timeStats[date]
        return stat.count !== undefined ? stat.count : (stat.pv || 0)
      })
      const uvData = Object.keys(behaviorStats.data.data.timeStats).sort().map((date) => {
        const stat = behaviorStats.data.data.timeStats[date]
        return stat.uv || 0
      })
      behaviorChart.setOption({
        xAxis: { data: dates },
        series: [
          { name: 'PV', data: pvData },
          { name: 'UV', data: uvData }
        ]
      })
    }
    
    // 更新接口成功率趋势图
    if (apiChart && apiStats.data.data.timeStats) {
      const dates = Object.keys(apiStats.data.data.timeStats)
      const successRates = Object.values(apiStats.data.data.timeStats).map((s: any) => {
        return s.total > 0 ? ((s.success / s.total) * 100).toFixed(2) : 0
      })
      apiChart.setOption({
        xAxis: { data: dates },
        series: [{ data: successRates }]
      })
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const initCharts = () => {
  if (errorChartRef.value) {
    errorChart = echarts.init(errorChartRef.value)
    errorChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', smooth: true, data: [] }]
    })
  }
  
  if (performanceChartRef.value) {
    performanceChart = echarts.init(performanceChartRef.value)
    performanceChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', name: 'ms' },
      series: [{ type: 'line', smooth: true, data: [] }]
    })
  }
  
  if (behaviorChartRef.value) {
    behaviorChart = echarts.init(behaviorChartRef.value)
    behaviorChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['PV', 'UV'] },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [
        { name: 'PV', type: 'line', smooth: true, data: [] },
        { name: 'UV', type: 'line', smooth: true, data: [] }
      ]
    })
  }
  
  if (apiChartRef.value) {
    apiChart = echarts.init(apiChartRef.value)
    apiChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', name: '%', max: 100 },
      series: [{ type: 'line', smooth: true, data: [] }]
    })
  }
}

const getErrorTypePercent = (type: string) => {
  const typeStats = overviewData.value.errors?.typeStats || {}
  const today = overviewData.value.errors?.today || 0
  if (today === 0) return '0'
  const count = typeStats[type] || 0
  return ((count / today) * 100).toFixed(1)
}

const getErrorTypeCount = (type: string) => {
  const typeStats = overviewData.value.errors?.typeStats || {}
  return typeStats[type] || 0
}

onMounted(() => {
  initCharts()
  loadData()
  timer = window.setInterval(loadData, 30000) // 每30秒刷新
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  errorChart?.dispose()
  performanceChart?.dispose()
  behaviorChart?.dispose()
  apiChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 600;
}

.metrics-row {
  margin-bottom: 16px;
}

.metric-card {
  height: 150px;
}

.metric-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 12px 16px;
}

.metric-icon {
  margin-right: 16px;
  color: #409eff;
  flex-shrink: 0;
}

.error-card {
  background: #fff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.error-card .metric-icon {
  color: #f56c6c;
}

.error-card .metric-value {
  color: #f56c6c;
}

.error-card .metric-label {
  color: #606266;
}

.error-card .metric-trend {
  color: #909399;
}

.performance-card .metric-icon {
  color: #e6a23c;
}

.behavior-card .metric-icon {
  color: #67c23a;
}

.api-card .metric-icon {
  color: #409eff;
}

.metric-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.error-card .metric-info {
  gap: 0;
  justify-content: space-between;
}

.metric-value {
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.2;
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 3px;
  line-height: 1.3;
}

.error-card .metric-value {
  margin-bottom: 0;
  font-size: 26px;
}

.error-card .metric-label {
  margin-bottom: 0;
  font-size: 12px;
}

.error-main-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.error-label-trend {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-card .metric-trend {
  font-size: 10px;
  margin-bottom: 0;
}

.metric-sub {
  font-size: 12px;
  color: #c0c4cc;
}

.metric-trend {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-bottom: 4px;
}

.error-card .metric-trend {
  color: #fff;
}

.trend-up {
  color: #f56c6c;
}

.trend-down {
  color: #67c23a;
}

.error-type-stats {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #ebeef5;
  width: 100%;
}

.error-type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  margin-bottom: 2px;
  line-height: 1.3;
  padding: 1px 0;
}

.error-type-item:last-child {
  margin-bottom: 0;
}

.error-type-label {
  color: #606266;
  flex-shrink: 0;
  margin-right: 6px;
  font-weight: 500;
}

.error-type-value {
  color: #303133;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: 11px;
}

.error-type-count {
  font-size: 10px;
  font-weight: 500;
  color: #909399;
}

.charts-row {
  margin-bottom: 16px;
}

.charts-row :deep(.el-card) {
  margin-bottom: 0;
}

.charts-row :deep(.el-card__body) {
  padding: 12px;
}
</style>

