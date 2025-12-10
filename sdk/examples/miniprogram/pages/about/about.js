// pages/about/about.js
const monitor = require('../../miniprogram.js')

Page({
  onLoad() {
    console.log('关于页加载')
    // 追踪页面访问（PV统计）
    monitor.pageLoadStart()
  },

  onReady() {
    // 页面加载完成（性能统计）
    monitor.pageLoadEnd()
  }
})

