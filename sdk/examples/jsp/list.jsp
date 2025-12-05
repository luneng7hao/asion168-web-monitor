<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.*" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSP 监控示例 - 列表页</title>
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
        .card h2 { color: #333; margin-bottom: 20px; }
        .breadcrumb { margin-bottom: 20px; color: #666; }
        .breadcrumb a { color: #667eea; text-decoration: none; }
        .list-item {
            padding: 15px;
            border: 1px solid #eee;
            border-radius: 8px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s;
        }
        .list-item:hover { border-color: #667eea; background: #f8f9ff; }
        .list-item h3 { color: #333; margin-bottom: 5px; }
        .list-item p { color: #666; font-size: 14px; }
        .list-item a {
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
        }
        .list-item a:hover { background: #5a6fd6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="breadcrumb">
                <a href="index.jsp">首页</a> / 列表页
            </div>
            <h2>📋 文章列表</h2>
            
            <%
                // 模拟数据
                String[][] articles = {
                    {"1", "前端监控系统设计与实现", "介绍如何搭建一个完整的前端监控系统..."},
                    {"2", "JavaScript 错误捕获最佳实践", "详解各种 JS 错误的捕获方式..."},
                    {"3", "Web 性能优化指南", "从多个维度优化 Web 应用性能..."},
                    {"4", "用户行为分析方法论", "如何通过数据分析用户行为..."},
                    {"5", "接口监控与告警", "API 监控的关键指标与告警策略..."}
                };
                
                for (String[] article : articles) {
            %>
            <div class="list-item" onclick="trackItemClick('<%= article[0] %>', '<%= article[1] %>')">
                <div>
                    <h3><%= article[1] %></h3>
                    <p><%= article[2] %></p>
                </div>
                <a href="detail.jsp?id=<%= article[0] %>">查看详情</a>
            </div>
            <% } %>
        </div>
    </div>

    <script src="monitor-sdk.js"></script>
    <script>
        var monitor = new Monitor({
            apiUrl: 'http://localhost:3000/api',
            projectId: 'demo-project',
            userId: 'jsp-user-001'
        });

        function trackItemClick(id, title) {
            monitor.track('list_item_click', {
                articleId: id,
                articleTitle: title,
                page: 'list.jsp'
            });
        }
    </script>
</body>
</html>

