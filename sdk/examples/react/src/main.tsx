import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import App from './App'
import monitor, { ErrorBoundary } from '@monitor/react'

// 路由监控组件
function RouterMonitor() {
  const location = useLocation()
  
  React.useEffect(() => {
    // 路由变化时上报（使用专门的 trackRouteChange 方法）
    monitor.trackRouteChange(
      document.referrer,
      location.pathname,
      {
        path: location.pathname,
        search: location.search
      }
    )
  }, [location])

  return null
}

// 初始化监控 SDK
// 从环境变量读取 apiUrl，默认为本地开发地址
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
monitor.init({
  apiUrl: apiUrl, // 注意：后端有全局前缀 /api
  projectId: '001',
  userId: 'react',
  enableError: true,
  enablePerformance: true,
  enableBehavior: true,
  enableApi: true,
  sampleRate: 1
})

// 从环境变量读取 base，默认为 '/'
const basename = import.meta.env.VITE_BASE || '/'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <RouterMonitor />
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

