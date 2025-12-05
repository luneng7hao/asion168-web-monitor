# Svelte 监控 SDK 测试工程

这是一个使用 Vite + Svelte 构建的测试工程，用于测试 Svelte 监控 SDK 的各项功能。

## 功能特性

- ✅ JavaScript 错误监控
- ✅ Promise 错误监控
- ✅ Svelte 组件错误监控（onError）
- ✅ 资源加载错误监控
- ✅ 页面性能监控（FCP、LCP、FID、CLS）
- ✅ 用户行为监控（PV、点击、路由变化）
- ✅ API 请求监控（Fetch、XMLHttpRequest）

## 技术栈

- Svelte 4
- Vite
- svelte-routing

**注意**：`svelte-routing` 可能会显示一个关于缺少 svelte exports condition 的警告，这是包本身的问题，不影响功能。如果需要消除警告，可以考虑使用其他路由库或等待包作者更新。

## 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
svelte/
├── src/
│   ├── views/          # 页面组件
│   │   ├── Home.svelte    # 首页
│   │   ├── About.svelte   # 关于页面
│   │   ├── ErrorTest.svelte  # 错误测试页面
│   │   └── Performance.svelte # 性能测试页面
│   ├── App.svelte      # 根组件
│   └── main.js         # 入口文件
├── package.json
├── vite.config.js
└── svelte.config.js
```

## Svelte 错误处理机制

### 1. onError 生命周期（Svelte 5 仅支持）

**注意**：`onError` 是 Svelte 5 的特性，当前项目使用 Svelte 4。

如果使用 Svelte 5，可以在组件中使用 `onError` 来捕获错误：

```svelte
<script>
  import { onError } from 'svelte'
  import { handleSvelteError } from '@monitor/svelte'

  onError((error) => {
    handleSvelteError(error, { component: 'ComponentName' })
  })
</script>
```

**Svelte 4 用户**：组件错误会通过全局错误监听器自动捕获（已在 SDK 中配置），无需额外处理。

### 2. monitorAction

使用 Svelte Action 来监控组件：

```svelte
<script>
  import { monitorAction } from '@monitor/svelte'
</script>

<div use:monitorAction={{ name: 'MyComponent' }}>
  <!-- 组件内容 -->
</div>
```

### 3. SvelteKit 错误处理

在 `hooks.server.ts` 或 `hooks.client.ts` 中：

```typescript
import { handleError as monitorHandleError } from '@monitor/svelte'

export function handleError({ error, event }) {
  monitorHandleError({ error, event })
  return { message: 'Internal Error' }
}
```

## 测试说明

### 错误监控测试

访问 `/error-test` 页面，可以测试：
- JavaScript 错误
- Promise 错误
- 资源加载错误
- Svelte 组件错误（通过 onError 捕获）
- 手动捕获错误

### 性能监控测试

访问 `/performance` 页面，可以测试：
- 页面加载时间
- FCP（首次内容绘制）
- LCP（最大内容绘制）
- FID（首次输入延迟）
- CLS（累积布局偏移）

### 行为监控测试

- PV：访问任何页面都会自动记录
- 点击：点击页面上的任何元素都会自动记录
- 路由变化：切换路由时会自动记录

### API 监控测试

在首页可以测试：
- Fetch 请求
- XMLHttpRequest 请求
- 错误请求

## 注意事项

1. 确保后端服务已启动（默认端口 3000）
2. 修改 `src/main.js` 中的 `projectId` 为你的项目 ID
3. SDK 会自动捕获所有监控数据并上报到后端
4. **版本说明**：
   - 当前项目使用 **Svelte 4**，不支持 `onError` 生命周期
   - 组件错误会通过全局错误监听器自动捕获
   - 如需使用 `onError`，请升级到 Svelte 5

