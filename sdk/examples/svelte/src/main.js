import App from './App.svelte'
import monitor from '@monitor/svelte'

// 初始化监控 SDK
// 从环境变量读取 apiUrl，默认为本地开发地址
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
monitor.init({
  apiUrl: apiUrl, // 注意：后端有全局前缀 /api
  projectId: '001',
  userId: 'svelte',
  enableError: true,
  enablePerformance: true,
  enableBehavior: true,
  enableApi: true,
  sampleRate: 1
})

const app = new App({
  target: document.getElementById('app')
})

export default app

