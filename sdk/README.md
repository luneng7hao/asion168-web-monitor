# 前端监控 SDK

支持多种前端技术栈的监控 SDK 集合。

## 📦 支持的平台

| SDK | 文件 | 适用场景 |
|-----|------|----------|
| 通用 Web | `src/index.ts` | 原生 JS/通用场景 |
| Vue | `src/vue.ts` | Vue 2.x / Vue 3.x 应用 |
| React | `src/react.ts` | React 应用 |
| Angular | `src/angular.ts` | Angular 应用 |
| Svelte/SvelteKit | `src/svelte.ts` | Svelte 应用 |
| Next.js | `src/nextjs.ts` | Next.js SSR/SSG |
| Nuxt.js | `src/nuxtjs.ts` | Nuxt.js SSR/SSG |
| 微信小程序 | `src/miniprogram.ts` | 微信小程序 |
| 多平台小程序 | `src/miniprogram-platforms.ts` | 支付宝/百度/抖音/快手小程序 |
| Taro | `src/taro.ts` | Taro 多端应用 |
| Uni-app | `src/uniapp.ts` | Uni-app 多端应用 |
| 微前端 | `src/micro-frontend.ts` | qiankun/Module Federation |
| jQuery | `src/jquery.ts` | jQuery 遗留系统 |
| PWA | `src/pwa.ts` | Progressive Web App |

## 🚀 快速开始

### 通用配置

所有 SDK 都使用相同的配置结构：

```typescript
interface MonitorConfig {
  apiUrl: string;        // 监控后端 API 地址
  projectId: string;     // 项目 ID（必需）
  userId?: string;       // 用户 ID
  enableError?: boolean; // 启用错误监控（默认 true）
  enablePerformance?: boolean; // 启用性能监控（默认 true）
  enableBehavior?: boolean;    // 启用行为监控（默认 true）
  enableApi?: boolean;         // 启用 API 监控（默认 true）
  sampleRate?: number;         // 采样率 0-1（默认 1）
}
```

### Vue 2.x

```typescript
// main.js
import Vue from 'vue';
import router from './router';
import monitor, { Vue2Plugin } from '@monitor/vue';

Vue.use(Vue2Plugin, {
  router,
  config: {
    apiUrl: 'http://localhost:3000/api',
    projectId: 'your-project-id'
  }
});
```

### Vue 3.x

```typescript
// main.ts
import { createApp } from 'vue';
import { createRouter } from 'vue-router';
import monitor, { Vue3Plugin } from '@monitor/vue';

const app = createApp(App);
const router = createRouter({...});

app.use(Vue3Plugin, {
  router,
  config: {
    apiUrl: 'http://localhost:3000/api',
    projectId: 'your-project-id'
  }
});

app.mount('#app');
```

### React

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import monitor, { ErrorBoundary } from '@monitor/react';

// 初始化监控
monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id'
}, BrowserRouter);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* 你的应用 */}
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

### Angular

```typescript
// app.module.ts
import { MonitorModule } from '@monitor/angular';

@NgModule({
  imports: [
    MonitorModule.forRoot({
      apiUrl: 'http://localhost:3000/api',
      projectId: 'your-project-id'
    })
  ]
})
export class AppModule {}
```

### Svelte/SvelteKit

```svelte
<script>
import monitor from '@monitor/svelte';

monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id'
});
</script>
```

### Next.js

```typescript
// _app.tsx
import monitor from '@monitor/nextjs';

monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id'
});
```

### Nuxt.js

```typescript
// plugins/monitor.ts (Nuxt 3)
import { defineNuxtMonitorPlugin } from '@monitor/nuxtjs';

export default defineNuxtMonitorPlugin({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id'
});
```

### 小程序（支付宝/百度/抖音/快手）

```javascript
import monitor from '@monitor/miniprogram-platforms';

monitor.init({
  apiUrl: 'https://your-api.com/api',
  projectId: 'your-project-id'
});
```

### Taro

```typescript
import monitor from '@monitor/taro';

monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id'
});
```

### Uni-app

```javascript
import monitor from '@monitor/uniapp';

monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id'
});
```

### 微前端（qiankun）

```typescript
// 主应用
import monitor from '@monitor/micro-frontend';

monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'main-app-id',
  appName: 'main-app',
  isMainApp: true
});

// 子应用
import monitor, { wrapQiankunLifeCycle } from '@monitor/micro-frontend';

monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'sub-app-id',
  appName: 'sub-app',
  isMainApp: false
});

export const { bootstrap, mount, unmount } = wrapQiankunLifeCycle({...}, 'sub-app');
```

### jQuery

```html
<script src="jquery.min.js"></script>
<script src="monitor-jquery.js"></script>
<script>
var monitor = new JQueryMonitor();
monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id'
});
</script>
```

### PWA

```javascript
import monitor from '@monitor/pwa';

monitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: 'your-project-id',
  enableServiceWorker: true,
  enableOffline: true,
  enablePush: true
});
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
```

### 特定平台方法

#### Vue
```typescript
// Vue 会自动捕获组件错误，无需手动调用
// 但可以手动上报错误
monitor.captureError(error, { componentName: 'MyComponent' })
```

#### React
```typescript
// 使用 ErrorBoundary 组件自动捕获错误
import { ErrorBoundary, withErrorBoundary } from '@monitor/react';

// 方式1: 使用组件
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>

// 方式2: 使用 HOC
const SafeComponent = withErrorBoundary(MyComponent);
```

#### Taro/Uni-app
```typescript
// 追踪页面 PV
monitor.trackPage(pagePath: string, options?: any)
```

#### 微前端
```typescript
// 注册子应用
monitor.registerSubApp(app: SubAppInfo)

// 切换当前应用上下文
monitor.setCurrentApp(appName: string)
```

## 📁 示例文件

每个 SDK 都在 `examples/` 目录下提供了完整的使用示例：

- `examples/vue/` - Vue 示例
- `examples/react/` - React 示例
- `examples/angular/` - Angular 示例
- `examples/svelte/` - Svelte/SvelteKit 示例
- `examples/nextjs/` - Next.js 示例
- `examples/nuxtjs/` - Nuxt.js 示例
- `examples/miniprogram-platforms/` - 多平台小程序示例
- `examples/taro/` - Taro 示例
- `examples/uniapp/` - Uni-app 示例
- `examples/micro-frontend/` - 微前端示例
- `examples/jquery/` - jQuery 示例
- `examples/pwa/` - PWA 示例

## 🔧 构建

```bash
npm install
npm run build
```

## 📝 监控内容

| 功能 | 说明 |
|------|------|
| 错误监控 | JS 错误、Promise 错误、资源加载错误、框架特定错误 |
| 性能监控 | 页面加载时间、Web Vitals (FCP, LCP, FID, CLS) |
| 行为监控 | PV/UV、路由变化、用户点击 |
| API 监控 | 接口响应时间、状态码、错误率 |

## 📄 License

MIT
