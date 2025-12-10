# JSP 监控 SDK 测试工程

这是一个使用通用 Web 监控 SDK 的 JSP 测试工程。

## 📋 目录结构

```
jsp/
├── index.jsp              # 主测试页面
├── js/
│   └── monitor/
│       └── index.js      # 监控 SDK（从 sdk/dist/index.js 复制）
└── README.md             # 本文件
```

## 🚀 快速开始

### 1. 准备 SDK 文件

确保 `js/monitor/index.js` 文件存在。如果不存在，请从 `sdk/dist/index.js` 复制：

```bash
# 在项目根目录执行
mkdir -p sdk/examples/jsp/js/monitor
cp sdk/dist/index.js sdk/examples/jsp/js/monitor/index.js
```

### 2. 配置 Web 服务器

将 `sdk/examples/jsp` 目录部署到支持 JSP 的 Web 服务器（如 Tomcat）。

**Tomcat 配置示例**：

1. 将 `jsp` 目录复制到 Tomcat 的 `webapps` 目录：
   ```bash
   cp -r sdk/examples/jsp /path/to/tomcat/webapps/monitor-jsp
   ```

2. 或者创建 WAR 文件：
   ```bash
   cd sdk/examples/jsp
   jar -cvf monitor-jsp.war .
   cp monitor-jsp.war /path/to/tomcat/webapps/
   ```

3. 启动 Tomcat：
   ```bash
   /path/to/tomcat/bin/startup.sh
   ```

### 3. 配置监控后端

在 `index.jsp` 中修改监控配置：

```javascript
const monitor = new window.Monitor({
    apiUrl: 'http://localhost:3000/api',  // 监控后端地址
    projectId: '001',                      // 项目ID（需要在管理端创建）
    userId: '<%= userId %>',               // 用户ID（从 session 获取）
    enableError: true,                      // 启用错误监控
    enablePerformance: true,               // 启用性能监控
    enableBehavior: true,                  // 启用行为监控
    enableApi: true,                       // 启用接口监控
    sampleRate: 1                          // 采样率（0-1）
});
```

### 4. 访问测试页面

访问 `http://localhost:8080/monitor-jsp/index.jsp`（根据你的 Tomcat 配置调整端口和路径）

## 🧪 功能测试

### 错误监控测试
- **触发 JS 错误**：测试 JavaScript 运行时错误捕获
- **触发 Promise 错误**：测试未处理的 Promise 拒绝
- **触发资源错误**：测试资源加载失败监控
- **手动捕获错误**：测试手动错误上报

### 用户行为追踪
- **追踪自定义事件**：测试自定义事件上报
- **追踪按钮点击**：测试按钮点击事件追踪

### 接口监控测试
- **测试成功 API 请求**：测试正常接口请求监控
- **测试 XHR 请求**：测试 XMLHttpRequest 监控
- **测试 Fetch 请求**：测试 Fetch API 监控
- **测试错误请求**：测试请求失败监控

### 性能监控测试
性能数据会在页面加载时自动收集，包括：
- 页面加载时间
- 首次内容绘制 (FCP)
- 最大内容绘制 (LCP)
- 首次输入延迟 (FID)
- 累积布局偏移 (CLS)

## 📝 注意事项

1. **SDK 文件路径**：确保 `js/monitor/index.js` 文件存在且路径正确
2. **CORS 配置**：如果监控后端在不同域名，需要配置 CORS
3. **Session 支持**：代码中使用了 `session`，确保 Web 服务器已启用 session 支持
4. **浏览器兼容性**：SDK 使用 ES2015+ 语法，需要现代浏览器支持
5. **JSP 编码**：确保 JSP 文件使用 UTF-8 编码

## 🔧 故障排查

### SDK 未加载
- 检查浏览器控制台是否有错误
- 确认 `js/monitor/index.js` 文件路径正确
- 检查 Web 服务器是否正确配置静态文件服务
- 确认 Tomcat 的 `web.xml` 配置允许访问 `.js` 文件

### 数据未上报
- 检查监控后端是否正常运行
- 检查 `apiUrl` 配置是否正确
- 检查浏览器控制台网络请求是否成功
- 确认项目 ID 已在管理端创建

### JSP 编译错误
- 检查 JSP 文件编码是否为 UTF-8
- 确认 Tomcat 版本支持 JSP 2.0+
- 检查 `pageEncoding` 和 `contentType` 设置

## 📚 更多信息

- [SDK 文档](../../README.md)
- [通用 Web SDK 使用说明](../../README.md#传统-web-应用htmljspphp-等)

