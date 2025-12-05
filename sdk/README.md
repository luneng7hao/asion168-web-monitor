# 前端监控 SDK

支持多种前端技术栈的监控 SDK 集合。

## 📋 目录

- [支持的平台](#支持的平台)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [配置选项](#配置选项)
- [示例项目](#示例项目)
- [构建和发布](#构建和发布)

## 📦 支持的平台

| SDK | 文件 | 适用场景 | 状态 |
|-----|------|----------|------|
| 通用 Web | `src/index.ts` | 原生 JS/通用场景 | ✅ |
| Vue 2/3 | `src/vue.ts` | Vue 2.x / Vue 3.x 应用 | ✅ |
| React | `src/react.ts` | React 应用 | ✅ |
| Svelte | `src/svelte.ts` | Svelte/SvelteKit 应用 | ✅ |
| 微信小程序 | `src/miniprogram.ts` | 微信小程序 | ✅ |
| PHP | `examples/php/` | PHP 服务端上报 | ✅ |
| JSP | `examples/jsp/` | JSP 服务端上报 | ✅ |

## 🚀 快速开始

### 安装

```bash
npm install
npm run build
```

### 通用配置

所有 SDK 都使用相同的配置结构：

```typescript
interface MonitorConfig {
  apiUrl: string;        // 监控后端 API 地址
  projectId: string;     // 项目 ID（必需，默认使用 '001'）
  userId?: string;       // 用户 ID
  enableError?: boolean; // 启用错误监控（默认 true）
  enablePerformance?: boolean; // 启用性能监控（默认 true）
  enableBehavior?: boolean;    // 启用行为监控（默认 true）
  enableApi?: boolean;         // 启用 API 监控（默认 true）
  sampleRate?: number;         // 采样率 0-1（默认 1）
}
```

### Web 项目（原生 JavaScript）

```javascript
import Monitor from './src/index.ts'

const monitor = new Monitor({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001',  // 默认项目ID
  userId: 'user-123' // 可选
})

// 自动开始监控
monitor.init()
```

### Vue 2.x

```javascript
// main.js
import Vue from 'vue'
import router from './router'
import { VueMonitor } from './src/vue'

Vue.use(VueMonitor, {
  router,
  config: {
    apiUrl: 'http://localhost:3000/api',
    projectId: '001'
  }
})
```

### Vue 3.x

```typescript
// main.ts
import { createApp } from 'vue'
import { createRouter } from 'vue-router'
import { VueMonitor } from './src/vue'

const app = createApp(App)
const router = createRouter({...})

app.use(VueMonitor, {
  router,
  config: {
    apiUrl: 'http://localhost:3000/api',
    projectId: '001'
  }
})

app.mount('#app')
```

### React

```typescript
// App.tsx
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ReactMonitor } from './src/react'

// 初始化监控
ReactMonitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001'
}, BrowserRouter)

function App() {
  return (
    <BrowserRouter>
      {/* 你的应用 */}
    </BrowserRouter>
  )
}
```

### Svelte/SvelteKit

```svelte
<!-- App.svelte -->
<script>
import { SvelteMonitor } from './src/svelte'

SvelteMonitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001'
})
</script>
```

### 微信小程序

```javascript
// app.js
import MiniProgramMonitor from './src/miniprogram'

MiniProgramMonitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001'
})
```

### PHP 服务端上报

```php
<?php
require_once 'monitor-sdk.php';

$monitor = new Monitor([
    'apiUrl' => 'http://localhost:3000/api',
    'projectId' => '001'
]);

// 上报错误
$monitor->reportError([
    'type' => 'php',
    'message' => 'Error message',
    'file' => __FILE__,
    'line' => __LINE__
]);
?>
```

### JSP 服务端上报

```jsp
<%@ page import="com.monitor.Monitor" %>
<%
Monitor monitor = new Monitor("http://localhost:3000/api", "001");
monitor.reportError("Error message", request);
%>
```

## 📖 API 参考

### 通用方法

所有 SDK 都提供以下方法：

```typescript
// 手动上报错误
monitor.captureError(error: Error, context?: any)

// 手动追踪事件
monitor.track(event: string, data?: any)

// 设置用户 ID
monitor.setUser(userId: string)

// 获取会话 ID
monitor.getSessionId(): string
```

### Vue 特定方法

```typescript
// Vue 会自动捕获组件错误，无需手动调用
// 但可以手动上报错误
monitor.captureError(error, { 
  componentName: 'MyComponent',
  props: {...},
  data: {...}
})
```

### React 特定方法

```typescript
// 使用 ErrorBoundary 组件自动捕获错误
import { ErrorBoundary } from './src/react'

<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

### 小程序特定方法

```typescript
// 追踪页面 PV
monitor.trackPage(pagePath: string, options?: any)

// 追踪自定义事件
monitor.trackEvent(eventName: string, data?: any)
```

## ⚙️ 配置选项

### 完整配置示例

```typescript
const config = {
  // 必需配置
  apiUrl: 'http://localhost:3000/api',
  projectId: '001',
  
  // 可选配置
  userId: 'user-123',
  enableError: true,
  enablePerformance: true,
  enableBehavior: true,
  enableApi: true,
  sampleRate: 1.0,  // 100% 采样
  
  // 高级配置
  maxQueueSize: 100,        // 最大队列长度
  flushInterval: 5000,      // 批量上报间隔（毫秒）
  enableConsole: false,     // 是否在控制台输出日志
  enableDebug: false,       // 是否启用调试模式
}
```

### 采样率配置

```typescript
// 只监控 10% 的请求（减少数据量）
sampleRate: 0.1
```

### 禁用特定监控

```typescript
// 只启用错误监控
enableError: true,
enablePerformance: false,
enableBehavior: false,
enableApi: false,
```

## 📁 示例项目

每个 SDK 都在 `examples/` 目录下提供了完整的使用示例：

- `examples/web/` - Web 原生示例
- `examples/vue2/` - Vue 2 示例
- `examples/vue3/` - Vue 3 示例
- `examples/react/` - React 示例
- `examples/svelte/` - Svelte 示例
- `examples/miniprogram/` - 微信小程序示例
- `examples/php/` - PHP 服务端上报示例
- `examples/jsp/` - JSP 服务端上报示例

运行示例：

```bash
# Vue 3 示例
cd examples/vue3
npm install
npm run dev

# React 示例
cd examples/react
npm install
npm run dev
```

## 🔧 构建和发布

### 开发模式

```bash
npm install
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 发布到 npm（可选）

```bash
npm login
npm publish
```

## 📝 监控内容

| 功能 | 说明 | 支持平台 |
|------|------|----------|
| 错误监控 | JS 错误、Promise 错误、资源加载错误 | 所有平台 |
| 性能监控 | 页面加载时间、Web Vitals (FCP, LCP, FID, CLS) | Web, Vue, React, Svelte |
| 行为监控 | PV/UV、路由变化、用户点击 | 所有平台 |
| API 监控 | 接口响应时间、状态码、错误率 | Web, Vue, React, Svelte, 小程序 |

## 🔍 调试

### 启用调试模式

```typescript
const monitor = new Monitor({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001',
  enableDebug: true,  // 启用调试模式
  enableConsole: true // 在控制台输出日志
})
```

### 查看上报数据

在浏览器控制台可以看到：
- 错误捕获日志
- 性能数据上报日志
- 行为追踪日志
- API 监控日志

## ⚠️ 注意事项

1. **项目ID**：系统使用单项目模式，SDK 需要使用默认项目ID `001`
2. **CORS**：确保后端已配置 CORS，允许前端域名访问
3. **采样率**：生产环境建议设置合理的采样率，避免数据量过大
4. **错误上报**：错误上报采用异步方式，不会阻塞页面
5. **性能影响**：SDK 经过优化，对页面性能影响极小

## 📚 相关文档

- [小程序使用指南](./miniprogram-usage.md)
- [项目主文档](../README.md)
- [后端文档 - MidwayJS](../backend-midway/README.md)
- [后端文档 - Spring Boot](../backend-springboot/README.md)

## 🐛 问题排查

### SDK 未上报数据

1. 检查 `apiUrl` 配置是否正确
2. 检查后端服务是否正常运行
3. 检查浏览器控制台是否有错误
4. 启用 `enableDebug: true` 查看详细日志

### Vue/React 路由未追踪

确保正确传入 router 实例：

```typescript
// Vue
app.use(VueMonitor, { router, config })

// React
ReactMonitor.init(config, BrowserRouter)
```

### 小程序上报失败

1. 检查小程序是否配置了合法域名
2. 检查 `apiUrl` 是否使用 HTTPS（生产环境）
3. 检查网络请求权限

## 📄 许可证

MIT

## 🔗 相关链接

- [项目主页](https://gitee.com/luneng17hao/asion168-web-monitor)
- [问题反馈](https://gitee.com/luneng17hao/asion168-web-monitor/issues)
- [贡献指南](../CONTRIBUTING.md)
