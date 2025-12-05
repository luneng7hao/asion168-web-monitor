// app.js
import monitor from '../../src/miniprogram.js'

// 初始化监控 SDK
monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'project-miniprogram-test-001',
  userId: 'miniprogram-user-001',
  enableError: true,
  enablePerformance: true,
  enableBehavior: true,
  enableApi: true,
  sampleRate: 1
})

App({
  onLaunch() {
    console.log('小程序启动')
    // 追踪应用启动
    monitor.track('app_launch', {
      scene: '1001', // 场景值
      path: 'pages/index/index'
    })
  },
  onShow() {
    console.log('小程序显示')
  },
  onHide() {
    console.log('小程序隐藏')
  },
  onError(error) {
    console.error('小程序全局错误:', error)
    // SDK 会自动捕获，这里可以额外处理
  }
})

