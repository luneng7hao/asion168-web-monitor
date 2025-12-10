// app.js
const monitor = require('./miniprogram.js')

// 初始化监控 SDK
// 注意：小程序无法访问 localhost，请使用以下方式之一：
// 1. 使用真实 IP 地址（如：http://192.168.1.100:3000/api）
// 2. 使用域名（需要在微信公众平台配置合法域名）
// 3. 在开发者工具中勾选"不校验合法域名"（仅开发环境）
monitor.init({
  // 开发环境：使用本机 IP 地址（在命令行运行 ipconfig 获取）
  // 例如：http://172.19.160.1:3000/api
  apiUrl: 'http://localhost:3000/api',  // ⚠️ 请改为真实 IP 或域名
  projectId: '001',
  userId: 'miniprogram',
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

