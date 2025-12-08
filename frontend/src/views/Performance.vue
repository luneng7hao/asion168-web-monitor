<template>
  <div class="performance-page">
    <h2 class="page-title">性能监控</h2>
    
    <!-- 性能指标卡片 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <el-card>
          <div class="metric-item">
            <div class="metric-value">{{ statsData.avgLoadTime || 0 }}ms</div>
            <div class="metric-label">平均加载时间</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="metric-item">
            <div class="metric-value">{{ statsData.avgFCP || 0 }}ms</div>
            <div class="metric-label">FCP (首次内容绘制)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="metric-item">
            <div class="metric-value">{{ statsData.avgLCP || 0 }}ms</div>
            <div class="metric-label">LCP (最大内容绘制)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="metric-item">
            <div class="metric-value">{{ statsData.avgFID || 0 }}ms</div>
            <div class="metric-label">FID (首次输入延迟)</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 性能趋势图 -->
    <el-card class="chart-card">
      <template #header>
        <span>性能趋势（最近7天）</span>
      </template>
      <div ref="chartRef" style="height: 200px"></div>
    </el-card>

    <!-- 性能数据列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>性能数据</span>
          <el-button type="primary" @click="loadPerformance">刷新</el-button>
        </div>
      </template>
      
      <el-table 
        :data="performanceList" 
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
        <el-table-column prop="userId" label="用户ID" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.userId || 'anonymous' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="页面URL" show-overflow-tooltip />
        <el-table-column prop="loadTime" label="加载时间(ms)" width="120" />
        <el-table-column prop="fcp" label="FCP(ms)" width="100" />
        <el-table-column prop="lcp" label="LCP(ms)" width="100" />
        <el-table-column prop="fid" label="FID(ms)" width="100" />
        <el-table-column prop="cls" label="CLS" width="100">
          <template #default="{ row }">
            {{ typeof row.cls === 'number' ? row.cls.toFixed(2) : row.cls }}
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadPerformance"
        @current-change="loadPerformance"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { performanceApi } from '../api'
import dayjs from 'dayjs'

const loading = ref(false)
const performanceList = ref<any[]>([])
const statsData = ref<any>({})
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const loadPerformance = async () => {
  loading.value = true
  try {
    const res = await performanceApi.getList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    performanceList.value = res.data.data
    pagination.value.total = res.data.total
  } catch (error) {
    console.error('加载性能数据失败:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await performanceApi.getStats()
    statsData.value = res.data.data
    
    // 更新图表
    if (chart && res.data.data.timeStats) {
      const dates = Object.keys(res.data.data.timeStats)
      const values = Object.values(res.data.data.timeStats).map((s: any) => s.avgLoadTime)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates },
        yAxis: { type: 'value', name: 'ms' },
        series: [{ type: 'line', smooth: true, data: values, name: '平均加载时间' }]
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
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', name: 'ms' },
      series: [{ type: 'line', smooth: true, data: [] }]
    })
  }
}

onMounted(() => {
  initChart()
  loadPerformance()
  loadStats()
})
</script>

<style scoped>
.performance-page {
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

.metric-item {
  text-align: center;
}

.metric-value {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #409eff;
}

.metric-label {
  font-size: 14px;
  color: #909399;
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
</style>

