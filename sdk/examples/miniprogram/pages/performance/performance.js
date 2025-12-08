// pages/performance/performance.js
import monitor from '../../../src/miniprogram.js'

Page({
  onLoad() {
    console.log('性能测试页加载')
    monitor.track('page_view', {
      page: 'pages/performance/performance',
      path: '/pages/performance/performance'
    })
  }
})

