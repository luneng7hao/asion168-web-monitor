// pages/error-test/error-test.js
const monitor = require('../../miniprogram.js')

Page({
  data: {
    logs: [],
    testImageUrl: '',
    showTestImage: false
  },

  onLoad() {
    console.log('错误测试页加载')
    // 追踪页面访问（PV统计）
    monitor.pageLoadStart()
  },

  onReady() {
    // 页面加载完成（性能统计）
    monitor.pageLoadEnd()
  },

  // 触发 JS 错误
  triggerJsError() {
    this.addLog('错误', '触发 JavaScript 错误...')
    // 故意触发错误
    const obj = null
    obj.doSomething()
  },

  // 触发 Promise 错误
  triggerPromiseError() {
    this.addLog('错误', '触发 Promise 错误...')
    Promise.reject(new Error('这是一个测试的 Promise 错误'))
  },

  // 触发资源加载错误（图片加载失败）
  triggerResourceError() {
    this.addLog('错误', '正在触发资源加载错误...')
    // 在小程序中，通过设置一个不存在的图片 URL 来触发资源加载错误
    // 使用 image 组件的 binderror 事件来捕获错误
    this.setData({
      testImageUrl: 'https://nonexistent-domain-12345.com/image.jpg',
      showTestImage: true
    })
  },

  // 图片加载错误处理
  onImageError(e) {
    const errorMsg = e.detail.errMsg || '图片加载失败'
    this.addLog('错误', '资源加载错误已触发：' + errorMsg)
    
    // 手动上报资源加载错误到监控系统
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const url = currentPage ? currentPage.route : 'unknown'
    
    monitor.captureError(new Error(`资源加载失败: ${this.data.testImageUrl}`), {
      type: 'resource',
      page: `/${url}`,
      resourceUrl: this.data.testImageUrl,
      errorMsg: errorMsg
    })
    
    this.addLog('错误', '资源加载错误已上报到监控系统')
    wx.showToast({
      title: '资源错误已上报',
      icon: 'success'
    })
    
    // 延迟隐藏测试图片
    setTimeout(() => {
      this.setData({
        showTestImage: false,
        testImageUrl: ''
      })
    }, 2000)
  },

  // 手动捕获错误
  captureManualError() {
    try {
      const obj = null
      obj.doSomething()
    } catch (error) {
      monitor.captureError(error, {
        action: '手动捕获',
        page: 'pages/error-test/error-test'
      })
      this.addLog('错误', '错误已手动捕获并上报')
      wx.showToast({
        title: '错误已捕获',
        icon: 'success'
      })
    }
  },

  // 添加日志
  addLog(type, message) {
    const time = new Date().toTimeString().split(' ')[0]
    const logs = this.data.logs
    logs.push({
      time,
      type,
      message
    })
    this.setData({ logs })
  }
})

