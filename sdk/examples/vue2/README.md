# Vue 2 监控 SDK 测试示例

这是一个使用 Vue 2 和监控 SDK 的完整示例项目。

## 功能特性

- ✅ Vue 2.x 错误捕获（组件错误、警告）
- ✅ JavaScript 错误监控
- ✅ Promise 错误监控
- ✅ 资源加载错误监控
- ✅ 性能监控（页面加载时间、Web Vitals）
- ✅ 用户行为追踪（PV、点击、路由变化）
- ✅ API 请求监控

## 安装依赖

```bash
npm install
```

## 运行项目

```bash
npm run serve
```

项目将在 `http://localhost:8080` 启动。

## 测试说明

### 1. 错误测试页面 (`/error-test`)

- **触发 JavaScript 错误**：测试 JS 运行时错误捕获
- **触发 Promise 错误**：测试未处理的 Promise 拒绝
- **触发资源加载错误**：测试图片等资源加载失败
- **触发 Vue 组件错误**：测试 Vue 组件渲染错误
- **手动捕获错误**：测试手动错误上报

### 2. 性能测试页面 (`/performance`)

- 查看页面性能指标
- 重新加载页面测试性能监控
- 模拟重任务测试性能影响

### 3. 路由测试

- 在不同页面间切换，测试路由变化监控
- 监控 SDK 会自动记录每次路由变化

### 4. API 监控测试

- 在首页点击"测试 API 请求"按钮
- 监控 SDK 会自动记录 API 请求和响应时间

## 配置说明

监控 SDK 的配置在 `src/main.js` 中：

```javascript
Vue.use(Vue2Plugin, {
  router,
  config: {
    apiUrl: 'http://localhost:3000/api',  // 监控后端地址
    projectId: 'vue2-test-project',        // 项目ID
    userId: 'vue2-user-001',               // 用户ID
    enableError: true,                     // 启用错误监控
    enablePerformance: true,               // 启用性能监控
    enableBehavior: true,                  // 启用行为监控
    enableApi: true,                       // 启用API监控
    sampleRate: 1                          // 采样率（0-1）
  }
});
```

## 注意事项

1. 确保监控后端服务已启动（默认 `http://localhost:3000`）
2. 在管理端创建项目后，将 `projectId` 替换为实际的项目ID
3. 所有错误和性能数据会自动上报到监控后端

