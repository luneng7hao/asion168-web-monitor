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
monitor.init({
  apiUrl: 'http://localhost:3000/api', // 注意：后端有全局前缀 /api
  projectId: '001',
  userId: 'react',
  enableError: true,
  enablePerformance: true,
  enableBehavior: true,
  enableApi: true,
  sampleRate: 1
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <RouterMonitor />
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

