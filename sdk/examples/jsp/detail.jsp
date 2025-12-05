<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSP 监控示例 - 详情页</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 900px; margin: 0 auto; }
        .card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .breadcrumb { margin-bottom: 20px; color: #666; }
        .breadcrumb a { color: #667eea; text-decoration: none; }
        h1 { color: #333; margin-bottom: 15px; }
        .meta { color: #888; font-size: 14px; margin-bottom: 20px; }
        .content { line-height: 1.8; color: #555; }
        .content p { margin-bottom: 15px; }
        .actions { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 10px;
        }
        .btn-primary { background: #667eea; color: white; }
        .btn-success { background: #67c23a; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="breadcrumb">
                <a href="index.jsp">首页</a> / <a href="list.jsp">列表</a> / 详情
            </div>
            
            <%
                String id = request.getParameter("id");
                if (id == null) id = "1";
                
                // 模拟文章数据
                String title = "前端监控系统设计与实现";
                String author = "技术团队";
                String date = "2024-01-15";
            %>
            
            <h1><%= title %></h1>
            <div class="meta">
                作者：<%= author %> | 发布时间：<%= date %> | 文章ID：<%= id %>
            </div>
            
            <div class="content">
                <p>前端监控系统是现代 Web 应用不可或缺的基础设施之一。通过监控系统，我们可以实时了解应用的运行状态，及时发现并解决问题。</p>
                <p>一个完整的前端监控系统通常包括以下几个模块：</p>
                <p><strong>1. 错误监控</strong> - 捕获 JavaScript 运行时错误、资源加载错误、Promise 未捕获错误等。</p>
                <p><strong>2. 性能监控</strong> - 收集页面加载时间、Web Vitals 指标等性能数据。</p>
                <p><strong>3. 用户行为追踪</strong> - 记录用户的访问路径、点击行为等。</p>
                <p><strong>4. 接口监控</strong> - 监控 API 请求的成功率、响应时间等。</p>
            </div>
            
            <div class="actions">
                <button class="btn btn-primary" onclick="trackLike()">👍 点赞</button>
                <button class="btn btn-success" onclick="trackShare()">🔗 分享</button>
            </div>
        </div>
    </div>

    <script src="monitor-sdk.js"></script>
    <script>
        var monitor = new Monitor({
            apiUrl: 'http://localhost:3000/api',
            projectId: 'demo-project',
            userId: 'jsp-user-001'
        });

        // 追踪文章阅读
        monitor.track('article_view', {
            articleId: '<%= id %>',
            articleTitle: '<%= title %>',
            page: 'detail.jsp'
        });

        function trackLike() {
            monitor.track('article_like', {
                articleId: '<%= id %>',
                page: 'detail.jsp'
            });
            alert('点赞成功！行为已追踪');
        }

        function trackShare() {
            monitor.track('article_share', {
                articleId: '<%= id %>',
                page: 'detail.jsp'
            });
            alert('分享成功！行为已追踪');
        }
    </script>
</body>
</html>

