import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 错误监控 API
export const errorApi = {
  getList: (params?: any) => api.get('/error/list', { params }),
  getDetail: (id: string) => api.get(`/error/detail/${id}`),
  getStats: () => api.get('/error/stats')
}

// 性能监控 API
export const performanceApi = {
  getList: (params?: any) => api.get('/performance/list', { params }),
  getStats: () => api.get('/performance/stats')
}

// 用户行为 API
export const behaviorApi = {
  getStats: (params?: { type?: string }) => api.get('/behavior/stats', { params }),
  getEvents: (params?: { type?: string; page?: number; pageSize?: number }) => 
    api.get('/behavior/events', { params })
}

// 接口监控 API
export const apiMonitorApi = {
  getStats: () => api.get('/api/stats'),
  getErrorDetails: (params: any) => api.get('/api/errors', { params })
}

// Dashboard API
export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview')
}

// 数据清理 API
export const dataCleanupApi = {
  clearAll: () => api.post('/data-cleanup/clear-all')
}

// 日志查询 API
export const logApi = {
  search: (params?: {
    userId?: string;
    type?: string;
    keyword?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    pageSize?: number;
  }) => api.get('/log/search', { params })
}

export default api

