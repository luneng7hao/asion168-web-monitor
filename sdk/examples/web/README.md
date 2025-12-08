# 通用 Web 监控 SDK 测试工程

这是一个使用通用 Web 监控 SDK (`index.ts`) 的测试工程，适用于原生 JavaScript、HTML 等场景。

## 快速开始

**重要提示**：由于使用了 ES6 模块，不能直接用 `file://` 协议打开 HTML 文件，必须使用 HTTP 服务器。

### 方式一：使用 Vite 开发服务器（推荐）

1. 安装依赖：
   ```bash
   cd sdk/examples/web
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 浏览器会自动打开 `http://localhost:8080`

### 方式二：使用 Python 启动本地服务器

1. 在 `sdk/examples/web` 目录下运行：
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Python 2
   python -m SimpleHTTPServer 8080
   ```

2. 访问 `http://localhost:8080/index.html`

### 方式三：使用 Live Server (VS Code)

1. 在 VS Code 中安装 "Live Server" 扩展
2. 右键点击 `index.html`，选择 "Open with Live Server"

### 方式四：使用 Node.js http-server

1. 全局安装 http-server：
   ```bash
   npm install -g http-server
   ```

2. 在 `sdk/examples/web` 目录下运行：
   ```bash
   http-server -p 8080
   ```

3. 访问 `http://localhost:8080/index.html`

## 功能测试

### 错误监控
- **触发 JS 错误**：测试 JavaScript 运行时错误捕获
- **触发 Promise 错误**：测试未处理的 Promise 拒绝
- **触发资源错误**：测试资源加载失败
- **手动捕获错误**：测试手动错误上报

### 用户行为追踪
- **追踪自定义事件**：测试自定义事件上报
- **追踪按钮点击**：测试按钮点击事件上报

### 接口监控
- **测试 XHR 请求**：测试 XMLHttpRequest 监控
- **测试 Fetch 请求**：测试 Fetch API 监控
- **测试错误请求**：测试请求失败监控

### 性能监控
性能数据会在页面加载时自动收集，包括：
- 页面加载时间
- 首次内容绘制 (FCP)
- 最大内容绘制 (LCP)
- 首次输入延迟 (FID)
- 累积布局偏移 (CLS)

## 配置

在 `index.html` 中修改监控配置：

```javascript
const monitor = new Monitor({
    apiUrl: 'http://localhost:3000/api',  // 监控后端地址
    projectId: 'project-web-test-001',      // 项目ID（需要在管理端创建）
    userId: 'web-user-001',                 // 用户ID（可选）
    enableError: true,                      // 启用错误监控
    enablePerformance: true,               // 启用性能监控
    enableBehavior: true,                   // 启用行为监控
    enableApi: true,                        // 启用接口监控
    sampleRate: 1                           // 采样率（0-1）
});
```

## 注意事项

1. **必须使用 HTTP 服务器**：不能直接用 `file://` 协议打开 HTML 文件，因为 ES6 模块需要 HTTP/HTTPS 协议
2. **项目ID**：需要在管理端创建项目后获取项目ID
3. **跨域配置**：确保监控后端已配置 CORS
4. **浏览器兼容性**：需要支持 ES6+ 的现代浏览器（Chrome、Firefox、Safari、Edge 等）

## 常见问题

### Q: 为什么不能直接用浏览器打开 HTML 文件？

A: 因为使用了 ES6 模块（`import`/`export`），浏览器出于安全考虑，不允许在 `file://` 协议下加载模块。必须使用 HTTP 服务器。

### Q: 如何快速启动服务器？

A: 推荐使用 Vite：
```bash
cd sdk/examples/web
npm install
npm run dev
```

或者使用 Python：
```bash
python -m http.server 8080
```

