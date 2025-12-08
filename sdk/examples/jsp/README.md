# JSP 项目监控 SDK 使用指南

本示例演示如何在传统 JSP/Java Web 项目中集成前端监控 SDK。

## 文件说明

```
jsp/
├── monitor-sdk.js    # 浏览器版监控 SDK（ES5 兼容）
├── index.jsp         # 首页（功能演示）
├── list.jsp          # 列表页
├── detail.jsp        # 详情页
├── form.jsp          # 表单页
└── README.md         # 使用说明
```

## 快速开始

### 1. 复制 SDK 文件

将 `monitor-sdk.js` 复制到你的 JSP 项目的静态资源目录（如 `webapp/js/`）。

### 2. 在 JSP 页面中引入 SDK

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <title>我的页面</title>
</head>
<body>
    <!-- 页面内容 -->
    
    <!-- 在页面底部引入 SDK -->
    <script src="${pageContext.request.contextPath}/js/monitor-sdk.js"></script>
    <script>
        // 初始化监控
        var monitor = new Monitor({
            apiUrl: 'http://your-monitor-server:3000/api',
            projectId: 'your-project-id',  // 在管理端创建项目后获取
            userId: '${sessionScope.userId}',  // 可选：从 Session 获取用户ID
            enableError: true,
            enablePerformance: true,
            enableBehavior: true,
            enableApi: true,
            sampleRate: 1
        });
    </script>
</body>
</html>
```

### 3. 在管理端创建项目

1. 启动监控后端服务
2. 访问管理端 `http://localhost:5173`
3. 点击"新建项目"，创建你的项目
4. 复制项目ID，填入 SDK 配置

## SDK 功能

### 自动监控（无需额外代码）

- **错误监控**：自动捕获 JS 错误、Promise 错误、资源加载错误
- **性能监控**：自动收集页面加载时间、Web Vitals 指标
- **PV 统计**：自动记录页面访问
- **点击追踪**：自动记录用户点击行为
- **接口监控**：自动监控 XHR 和 Fetch 请求

### 手动追踪

```javascript
// 手动捕获错误
try {
    // 业务代码
} catch (error) {
    monitor.captureError(error, {
        action: '用户操作',
        page: 'index.jsp'
    });
}

// 追踪自定义事件
monitor.track('button_click', {
    buttonId: 'submitBtn',
    page: 'form.jsp'
});

// 追踪表单提交
monitor.track('form_submit', {
    formId: 'loginForm',
    success: true
});

// 设置用户ID（登录后）
monitor.setUserId('user-123');
```

## 配置选项

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| apiUrl | string | 是 | - | 监控后端 API 地址 |
| projectId | string | 是 | - | 项目ID（管理端创建） |
| userId | string | 否 | '' | 用户ID |
| enableError | boolean | 否 | true | 是否启用错误监控 |
| enablePerformance | boolean | 否 | true | 是否启用性能监控 |
| enableBehavior | boolean | 否 | true | 是否启用行为追踪 |
| enableApi | boolean | 否 | true | 是否启用接口监控 |
| sampleRate | number | 否 | 1 | 采样率（0-1） |

## 与 Session 集成

在 JSP 中，可以方便地将服务端信息传递给 SDK：

```jsp
<script>
    var monitor = new Monitor({
        apiUrl: 'http://localhost:3000/api',
        projectId: 'your-project-id',
        userId: '<%= session.getAttribute("userId") != null ? session.getAttribute("userId") : "" %>'
    });
    
    // 追踪页面访问，附带服务端信息
    monitor.track('page_view', {
        page: '<%= request.getRequestURI() %>',
        sessionId: '<%= session.getId() %>',
        serverTime: '<%= new java.util.Date() %>'
    });
</script>
```

## 运行示例

### 方式一：使用 Tomcat

1. 将整个 `jsp` 目录复制到 Tomcat 的 `webapps` 目录
2. 启动 Tomcat
3. 访问 `http://localhost:8080/jsp/index.jsp`

### 方式二：使用其他 Servlet 容器

将 JSP 文件部署到任意支持 JSP 的 Servlet 容器中。

### 方式三：直接用浏览器打开（仅测试）

由于示例不依赖复杂的服务端逻辑，可以将 `.jsp` 改为 `.html` 后直接用浏览器打开测试。

## 注意事项

1. **跨域配置**：确保监控后端已配置 CORS，允许你的 JSP 应用域名
2. **HTTPS**：生产环境建议使用 HTTPS
3. **采样率**：高流量网站建议降低采样率（如 0.1）
4. **错误过滤**：可以在后端配置错误过滤规则，忽略无关错误

## 兼容性

- IE 9+（需要 polyfill）
- Chrome、Firefox、Safari、Edge 等现代浏览器
- 移动端浏览器

## 常见问题

### Q: 数据没有上报？

1. 检查浏览器控制台是否有错误
2. 确认 `apiUrl` 和 `projectId` 配置正确
3. 检查网络请求是否被拦截（跨域、防火墙等）

### Q: 如何区分不同环境的数据？

建议为不同环境创建不同的项目：
- 开发环境：`dev-project`
- 测试环境：`test-project`
- 生产环境：`prod-project`

### Q: 如何追踪登录用户？

```jsp
<%
    String userId = (String) session.getAttribute("userId");
    if (userId == null) userId = "";
%>
<script>
    var monitor = new Monitor({
        apiUrl: 'http://localhost:3000/api',
        projectId: 'your-project-id',
        userId: '<%= userId %>'
    });
</script>
```

或者在用户登录后动态设置：

```javascript
// 登录成功后
monitor.setUserId('user-123');
```

