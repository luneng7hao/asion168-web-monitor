<template>
  <div class="behavior-page">
    <div class="page-header">
      <h2 class="page-title">用户行为</h2>
      <div class="filter-section">
        <el-select 
          v-model="selectedType" 
          placeholder="选择行为类型" 
          style="width: 200px"
          @change="handleTypeChange"
        >
          <el-option label="全部" value="" />
          <el-option label="页面访问 (PV)" value="pv">
            <span style="float: left">页面访问 (PV)</span>
            <span style="float: right; color: #8492a6; font-size: 13px">页面加载时自动记录</span>
          </el-option>
          <el-option label="点击事件" value="click">
            <span style="float: left">点击事件</span>
            <span style="float: right; color: #8492a6; font-size: 13px">用户点击按钮等操作</span>
          </el-option>
          <el-option label="路由变化" value="route-change">
            <span style="float: left">路由变化</span>
            <span style="float: right; color: #8492a6; font-size: 13px">SPA页面路由切换</span>
          </el-option>
          <el-option label="自定义事件" value="custom">
            <span style="float: left">自定义事件</span>
            <span style="float: right; color: #8492a6; font-size: 13px">通过track()方法上报</span>
          </el-option>
        </el-select>
      </div>
    </div>
    
    <!-- 说明提示 -->
    <el-alert
      v-if="selectedType"
      :title="getTypeDescription()"
      type="info"
      :closable="false"
      style="margin-bottom: 12px"
    />
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="12">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statsData.total !== undefined ? statsData.total : (statsData.pv || 0) }}</div>
            <div class="stat-label">{{ getTypeLabel() }}总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ statsData.uv || 0 }}</div>
            <div class="stat-label">独立访客 (UV)</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 访问趋势图 -->
    <el-card class="chart-card">
      <template #header>
        <span>{{ getTypeLabel() }}趋势（最近7天）</span>
      </template>
      <div ref="chartRef" style="height: 200px"></div>
    </el-card>

    <!-- 热门页面/事件 -->
    <el-card class="table-card">
      <template #header>
        <span>{{ selectedType ? getTypeLabel() + '排行' : '热门页面' }}</span>
      </template>
      
      <el-table 
        :data="(statsData.topItems || statsData.topPages || [])" 
        stripe
        :max-height="200"
        style="width: 100%"
      >
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="url" :label="selectedType ? '事件URL' : '页面URL'" show-overflow-tooltip />
        <el-table-column prop="userId" label="用户ID" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.userId || 'anonymous' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="count" :label="selectedType ? '发生次数' : '访问次数'" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.count }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 事件详情列表（仅显示点击事件和自定义事件） -->
    <el-card class="table-card" v-if="selectedType === 'click' || selectedType === 'custom'">
      <template #header>
        <div class="card-header">
          <span>{{ getTypeLabel() }}详情</span>
          <el-pagination
            v-model:current-page="eventPage"
            :page-size="eventPageSize"
            :total="eventTotal"
            layout="prev, pager, next"
            @current-change="loadEvents"
            small
          />
        </div>
      </template>
      
      <el-table 
        :data="eventList" 
        stripe 
        v-loading="eventLoading"
        :max-height="200"
        style="width: 100%"
      >
        <el-table-column prop="time" label="触发时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="用户ID" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.userId || 'anonymous' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="URL" show-overflow-tooltip min-width="200" />
        <el-table-column prop="path" label="路径" show-overflow-tooltip min-width="150" />
        <el-table-column label="详细信息" min-width="300">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              size="small"
              @click="showEventDetail(row)"
            >
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 事件详情对话框 -->
      <el-dialog
        v-model="detailDialogVisible"
        :title="`${getTypeLabel()}详情`"
        width="800px"
        destroy-on-close
      >
        <div class="event-detail-dialog" v-if="currentEventDetail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="触发时间">
              {{ formatTime(currentEventDetail.time) }}
            </el-descriptions-item>
            <el-descriptions-item label="页面URL">
              <span class="text-ellipsis">{{ currentEventDetail.url }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="路径">
              {{ currentEventDetail.path || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="用户ID">
              {{ currentEventDetail.userId || 'anonymous' }}
            </el-descriptions-item>
            <el-descriptions-item label="会话ID" :span="2">
              {{ currentEventDetail.sessionId || '-' }}
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="detail-data-section">
            <h4>详细数据</h4>
            <div class="detail-json">
              <pre>{{ JSON.stringify(currentEventDetail.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { View } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { behaviorApi } from '../api'

const selectedType = ref<string>('')
const statsData = ref<any>({})
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 事件详情列表
const eventList = ref<any[]>([])
const eventPage = ref<number>(1)
const eventPageSize = ref<number>(20)
const eventTotal = ref<number>(0)
const eventLoading = ref<boolean>(false)

// 详情对话框
const detailDialogVisible = ref<boolean>(false)
const currentEventDetail = ref<any>(null)

const getTypeLabel = () => {
  const typeMap: Record<string, string> = {
    '': '访问',
    'pv': '页面访问',
    'click': '点击事件',
    'route-change': '路由变化',
    'custom': '自定义事件'
  }
  return typeMap[selectedType.value] || '行为'
}

const getTypeDescription = () => {
  const descMap: Record<string, string> = {
    'pv': '页面访问 (PV)：记录用户每次访问页面的行为，包括页面加载、刷新等。',
    'click': '点击事件：记录用户点击按钮、链接等交互操作。',
    'route-change': '路由变化：记录单页应用(SPA)中的路由切换行为。',
    'custom': '自定义事件：通过 monitor.track() 方法主动上报的业务事件。'
  }
  return descMap[selectedType.value] || ''
}

const handleTypeChange = () => {
  loadStats()
  // 如果是点击事件或自定义事件，加载详情列表
  if (selectedType.value === 'click' || selectedType.value === 'custom') {
    eventPage.value = 1
    loadEvents()
  } else {
    eventList.value = []
    eventTotal.value = 0
  }
}

const loadStats = async () => {
  try {
    const params = selectedType.value ? { type: selectedType.value } : undefined
    const res = await behaviorApi.getStats(params)
    statsData.value = res.data.data
    
    // 更新图表
    if (chart && res.data.data.timeStats) {
      const dates = Object.keys(res.data.data.timeStats)
      const countData = Object.values(res.data.data.timeStats).map((s: any) => s.count)
      const uvData = Object.values(res.data.data.timeStats).map((s: any) => s.uv)
      
      const typeLabel = getTypeLabel()
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: [typeLabel, 'UV'] },
        xAxis: { type: 'category', data: dates },
        yAxis: { type: 'value' },
        series: [
          { name: typeLabel, type: 'line', smooth: true, data: countData },
          { name: 'UV', type: 'line', smooth: true, data: uvData }
        ]
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
      legend: { data: ['PV', 'UV'] },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [
        { name: 'PV', type: 'line', smooth: true, data: [] },
        { name: 'UV', type: 'line', smooth: true, data: [] }
      ]
    })
  }
}

const loadEvents = async () => {
  if (selectedType.value !== 'click' && selectedType.value !== 'custom') {
    return
  }
  
  try {
    eventLoading.value = true
    const res = await behaviorApi.getEvents({
      type: selectedType.value,
      page: eventPage.value,
      pageSize: eventPageSize.value
    })
    eventList.value = res.data.data.list || []
    eventTotal.value = res.data.data.total || 0
  } catch (error) {
    console.error('加载事件详情失败:', error)
    eventList.value = []
    eventTotal.value = 0
  } finally {
    eventLoading.value = false
  }
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const showEventDetail = (row: any) => {
  currentEventDetail.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  initChart()
  loadStats()
})
</script>

<style scoped>
.behavior-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #67c23a;
}

.stat-label {
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

.event-detail-dialog {
  padding: 10px 0;
}

.detail-data-section {
  margin-top: 20px;
}

.detail-data-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.detail-json {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  max-height: 400px;
  overflow-y: auto;
}

.detail-json pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: #606266;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
}

.text-ellipsis {
  display: inline-block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>

