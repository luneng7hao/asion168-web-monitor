// pages/about/about.js
import monitor from '../../../src/miniprogram.js'

Page({
  onLoad() {
    console.log('关于页加载')
    monitor.track('page_view', {
      page: 'pages/about/about',
      path: '/pages/about/about'
    })
  }
})

