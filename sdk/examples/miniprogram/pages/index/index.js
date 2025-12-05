// pages/index/index.js
import monitor from '../../../src/miniprogram.js'

Page({
  data: {
    logs: []
  },

  onLoad() {
    console.log('首页加载')
    // 追踪页面访问
    monitor.track('page_view', {
      page: 'pages/index/index',
      path: '/pages/index/index'
    })
  },

  onShow() {
    console.log('首页显示')
  },

  // 测试 API 请求
  testRequest() {
    wx.request({
      url: 'https://api.github.com/users/octocat',
      method: 'GET',
      success: (res) => {
        console.log('请求成功', res)
        wx.showToast({
          title: '请求成功',
          icon: 'success'
        })
        this.addLog('接口', '请求成功，状态码：' + res.statusCode)
      },
      fail: (err) => {
        console.error('请求失败', err)
        wx.showToast({
          title: '请求失败',
          icon: 'error'
        })
        this.addLog('错误', '请求失败')
      }
    })
  },

  // 测试错误请求
  testErrorRequest() {
    wx.request({
      url: 'https://nonexistent-domain-12345.com/api',
      method: 'GET',
      success: (res) => {
        this.addLog('接口', '请求完成')
      },
      fail: (err) => {
        this.addLog('错误', '请求失败（已监控）')
        wx.showToast({
          title: '错误请求已监控',
          icon: 'none'
        })
      }
    })
  },

  // 追踪自定义事件
  trackCustomEvent() {
    monitor.track('custom_event', {
      action: 'click',
      button: 'trackCustomEvent',
      page: 'pages/index/index'
    })
    this.addLog('行为', '自定义事件已追踪')
    wx.showToast({
      title: '事件已追踪',
      icon: 'success'
    })
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

