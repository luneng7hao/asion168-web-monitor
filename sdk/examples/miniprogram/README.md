# 微信小程序监控 SDK 测试工程

这是一个使用微信小程序监控 SDK (`miniprogram.ts`) 的测试工程。

## 快速开始

### 1. 使用微信开发者工具

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择 `sdk/examples/miniprogram` 目录
4. 填写项目信息：
   - **AppID**：可以使用测试号 `touristappid` 或填写自己的 AppID
   - **项目名称**：miniprogram-monitor-test
5. 点击"导入"

### 2. 配置监控后端

在 `app.js` 中修改监控配置：

```javascript
monitor.init({
  apiUrl: 'http://localhost:3000/api',  // 监控后端地址
  projectId: 'project-miniprogram-test-001',  // 项目ID（需要在管理端创建）
  userId: 'miniprogram-user-001',      // 用户ID（可选）
  enableError: true,                    // 启用错误监控
  enablePerformance: true,              // 启用性能监控
  enableBehavior: true,                 // 启用行为监控
  enableApi: true,                      // 启用接口监控
  sampleRate: 1                         // 采样率（0-1）
})
```

### 3. 配置网络请求域名

在微信开发者工具中：
1. 点击右上角"详情"
2. 在"本地设置"中勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
3. 或者在"开发管理" -> "开发设置" -> "服务器域名"中添加你的监控后端域名

## 功能测试

### 首页 (pages/index/index)
- **测试正常请求**：测试 wx.request 正常请求监控
- **测试错误请求**：测试请求失败监控
- **追踪自定义事件**：测试自定义事件上报

### 错误测试页 (pages/error-test/error-test)
- **触发 JS 错误**：测试 JavaScript 错误捕获
- **触发 Promise 错误**：测试未处理的 Promise 拒绝
- **手动捕获错误**：测试手动错误上报

### 性能测试页 (pages/performance/performance)
性能数据会在页面加载时自动收集，包括：
- 页面加载时间
- 渲染时间
- 系统信息（设备信息、网络类型等）

## SDK 功能

### 自动监控（无需额外代码）

- **错误监控**：自动捕获 JS 错误、Promise 错误、小程序生命周期错误
- **性能监控**：自动收集页面加载时间、渲染时间
- **PV 统计**：自动记录页面访问
- **接口监控**：自动监控 wx.request 请求

### 手动追踪

```javascript
const monitor = require('./miniprogram.js')

// 手动捕获错误
try {
  // 业务代码
} catch (error) {
  monitor.captureError(error, {
    action: '用户操作',
    page: 'pages/index/index'
  })
}

// 追踪自定义事件
monitor.track('button_click', {
  buttonId: 'submitBtn',
  page: 'pages/index/index'
})

// 追踪页面访问
monitor.track('page_view', {
  page: 'pages/index/index',
  path: '/pages/index/index'
})

// 设置用户ID（登录后）
monitor.setUserId('user-123')
```

## 注意事项

1. **项目ID**：需要在管理端创建项目后获取项目ID
2. **网络请求域名**：需要在微信公众平台配置合法域名，或使用开发工具的不校验选项
3. **HTTPS**：生产环境必须使用 HTTPS
4. **AppID**：可以使用测试号进行开发，但生产环境需要自己的 AppID

## 兼容性

- 微信小程序基础库 2.0.0+
- 支持所有微信小程序平台（iOS、Android、开发者工具）

## 常见问题

### Q: 数据没有上报？

1. 检查微信开发者工具控制台是否有错误
2. 确认 `apiUrl` 和 `projectId` 配置正确
3. 检查网络请求域名是否配置
4. 确认监控后端服务正常运行

### Q: 如何区分不同环境的数据？

建议为不同环境创建不同的项目：
- 开发环境：`dev-miniprogram-project`
- 测试环境：`test-miniprogram-project`
- 生产环境：`prod-miniprogram-project`

### Q: 如何追踪登录用户？

```javascript
// 在登录成功后
monitor.setUserId('user-123')
```

