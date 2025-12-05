# 微信小程序监控 SDK 使用指南

## 安装

将 `miniprogram.ts` 文件复制到你的小程序项目中，或者编译后引入。

## 初始化

### 1. 在 App.js 中初始化

```javascript
// app.js
import MiniProgramMonitor from './utils/miniprogram'

const monitor = new MiniProgramMonitor({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id',  // 必需：在管理端创建项目后获取的唯一标识
  userId: 'user-123', // 可选
  enableError: true,
  enablePerformance: true,
  enableBehavior: true,
  enableApi: true,
  sampleRate: 1 // 采样率 0-1
})

App({
  monitor, // 将 monitor 挂载到 App 实例上，方便在页面中访问
  onLaunch() {
    console.log('小程序启动')
  },
  onError(error) {
    // SDK 会自动捕获，这里可以添加额外处理
    console.error('App Error:', error)
  }
})
```

### 2. 在页面中使用

#### 方式一：自动监控（推荐）

在每个页面的生命周期中调用监控方法：

```javascript
// pages/index/index.js
const app = getApp()

Page({
  onLoad() {
    // 页面加载开始
    if (app.monitor) {
      app.monitor.pageLoadStart()
    }
  },
  
  onReady() {
    // 页面渲染完成
    if (app.monitor) {
      app.monitor.pageLoadEnd()
    }
  },
  
  onShow() {
    // 页面显示（PV 统计）
    if (app.monitor) {
      app.monitor.track('page_show')
    }
  },
  
  onHide() {
    // 页面隐藏
    if (app.monitor) {
      app.monitor.track('page_hide')
    }
  },
  
  // 页面跳转
  navigateToDetail() {
    if (app.monitor) {
      app.monitor.track('navigate', {
        target: 'detail',
        action: 'click'
      })
    }
    wx.navigateTo({
      url: '/pages/detail/detail'
    })
  }
})
```

#### 方式二：使用静态方法

```javascript
// pages/index/index.js
import MiniProgramMonitor from '../../utils/miniprogram'

Page({
  onLoad() {
    const monitor = MiniProgramMonitor.getInstance()
    if (monitor) {
      monitor.pageLoadStart()
    }
  }
})
```

## 功能说明

### 1. 错误监控

SDK 会自动捕获以下错误：
- JavaScript 运行时错误（通过 `wx.onError`）
- Promise 未捕获错误（通过 `wx.onUnhandledRejection`）

手动捕获错误：

```javascript
try {
  // 你的代码
} catch (error) {
  const monitor = MiniProgramMonitor.getInstance()
  if (monitor) {
    monitor.captureError(error, {
      customData: '额外的上下文信息'
    })
  }
}
```

### 2. 性能监控

在页面的 `onLoad` 和 `onReady` 中调用：

```javascript
Page({
  onLoad() {
    app.monitor?.pageLoadStart()
  },
  
  onReady() {
    app.monitor?.pageLoadEnd()
  }
})
```

### 3. 用户行为追踪

自动追踪：
- 页面访问（PV）
- 页面显示/隐藏

手动追踪：

```javascript
// 追踪按钮点击
handleClick() {
  app.monitor?.track('button_click', {
    buttonId: 'submit',
    buttonText: '提交'
  })
}

// 追踪表单提交
handleSubmit() {
  app.monitor?.track('form_submit', {
    formId: 'login-form'
  })
}
```

### 4. 接口监控

SDK 会自动拦截 `wx.request`，监控所有网络请求：
- 请求 URL
- 请求方法
- 响应状态码
- 响应时间
- 请求/响应数据（可选）

无需额外配置，自动生效。

## 完整示例

### app.js

```javascript
import MiniProgramMonitor from './utils/miniprogram'

const monitor = new MiniProgramMonitor({
  apiUrl: 'https://your-api-domain.com/api',
  projectId: 'your-project-id'
})

App({
  monitor,
  onLaunch() {
    console.log('小程序启动')
  }
})
```

### pages/index/index.js

```javascript
const app = getApp()

Page({
  data: {
    userInfo: null
  },
  
  onLoad() {
    // 性能监控：页面加载开始
    app.monitor?.pageLoadStart()
    
    // 行为追踪：页面访问
    app.monitor?.track('page_view', {
      page: 'index'
    })
  },
  
  onReady() {
    // 性能监控：页面加载完成
    app.monitor?.pageLoadEnd()
  },
  
  onShow() {
    app.monitor?.track('page_show')
  },
  
  getUserInfo() {
    wx.getUserInfo({
      success: (res) => {
        this.setData({ userInfo: res.userInfo })
        
        // 追踪用户行为
        app.monitor?.track('get_user_info', {
          success: true
        })
      },
      fail: (err) => {
        // 手动捕获错误
        app.monitor?.captureError(err, {
          action: 'getUserInfo'
        })
      }
    })
  },
  
  makeRequest() {
    wx.request({
      url: 'https://api.example.com/data',
      method: 'GET',
      success: (res) => {
        console.log('请求成功', res)
        // 接口监控会自动记录
      },
      fail: (err) => {
        // 接口错误也会自动记录
        console.error('请求失败', err)
      }
    })
  }
})
```

## 注意事项

1. **网络请求域名配置**：确保在小程序管理后台配置了监控 API 的域名白名单

2. **数据上报频率**：可以通过 `sampleRate` 参数控制采样率，减少数据上报量

3. **性能影响**：SDK 采用异步上报，不会阻塞主线程

4. **错误处理**：SDK 内部有错误处理机制，不会影响小程序正常运行

5. **数据安全**：敏感数据建议在服务端过滤，不要在上报数据中包含用户敏感信息

## 与 Web 版本的区别

| 功能 | Web 版本 | 小程序版本 |
|------|---------|-----------|
| 错误捕获 | window.onerror | wx.onError |
| 接口监控 | fetch/XHR | wx.request |
| 性能监控 | Performance API | 页面生命周期 |
| 用户行为 | DOM 事件 | 页面生命周期 + 手动追踪 |
| 系统信息 | navigator.userAgent | wx.getSystemInfo |

## 支持的功能

✅ JavaScript 错误监控  
✅ Promise 错误监控  
✅ 接口请求监控  
✅ 页面性能监控  
✅ 用户行为追踪  
✅ 自动 PV 统计  
✅ 手动事件追踪  

❌ 资源加载错误（小程序不支持）  
❌ Web Vitals（小程序不支持 Performance API）  
❌ DOM 事件监听（小程序没有 DOM）

