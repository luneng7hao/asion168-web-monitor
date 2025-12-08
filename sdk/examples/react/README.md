# React 监控 SDK 测试工程

这是一个使用 Vite + React + TypeScript 构建的测试工程，用于测试 React 监控 SDK 的各项功能。

## 功能特性

- ✅ JavaScript 错误监控
- ✅ Promise 错误监控
- ✅ React 组件错误监控（Error Boundary）
- ✅ 资源加载错误监控
- ✅ 页面性能监控（FCP、LCP、FID、CLS）
- ✅ 用户行为监控（PV、点击、路由变化）
- ✅ API 请求监控（Fetch、XMLHttpRequest）

## 技术栈

- React 18
- TypeScript
- Vite
- React Router

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
react/
├── src/
│   ├── views/          # 页面组件
│   │   ├── Home.tsx    # 首页
│   │   ├── About.tsx   # 关于页面
│   │   ├── ErrorTest.tsx  # 错误测试页面
│   │   └── Performance.tsx # 性能测试页面
│   ├── App.tsx         # 根组件
│   └── main.tsx        # 入口文件
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 测试说明

### 错误监控测试

访问 `/error-test` 页面，可以测试：
- JavaScript 错误
- Promise 错误
- 资源加载错误
- React 组件错误（通过 Error Boundary 捕获）
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
2. 修改 `src/main.tsx` 中的 `projectId` 为你的项目 ID
3. SDK 会自动捕获所有监控数据并上报到后端

