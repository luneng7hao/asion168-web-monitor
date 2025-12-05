<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.Date" %>
<%@ page import="java.text.SimpleDateFormat" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSP 监控示例 - 首页</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
        }
        .server-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 14px;
            color: #555;
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .btn-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5a6fd6;
        }
        .btn-danger {
            background: #f56c6c;
            color: white;
        }
        .btn-danger:hover {
            background: #e45a5a;
        }
        .btn-success {
            background: #67c23a;
            color: white;
        }
        .btn-success:hover {
            background: #5daf34;
        }
        .btn-warning {
            background: #e6a23c;
            color: white;
        }
        .btn-warning:hover {
            background: #d69330;
        }
        .log-area {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 20px;
        }
        .log-area .log-item {
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #444;
        }
        .log-area .log-time {
            color: #888;
        }
        .log-area .log-type {
            color: #67c23a;
            font-weight: bold;
        }
        .log-area .log-error {
            color: #f56c6c;
        }
        .nav-links {
            margin-top: 20px;
        }
        .nav-links a {
            color: #667eea;
            text-decoration: none;
            margin-right: 20px;
        }
        .nav-links a:hover {
            text-decoration: underline;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: 500;
        }
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 JSP 前端监控示例</h1>
            <p>这是一个使用监控 SDK 的 JSP 页面示例，演示如何在传统 Java Web 项目中集成前端监控。</p>
            <div class="server-info">
                <strong>服务器信息：</strong><br>
                当前时间：<%= new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()) %><br>
                服务器：<%= application.getServerInfo() %><br>
                Session ID：<%= session.getId().substring(0, 8) %>...
            </div>
        </div>

        <!-- 错误监控测试 -->
        <div class="card">
            <h2>🐛 错误监控测试</h2>
            <div class="btn-group">
                <button class="btn btn-danger" onclick="triggerJsError()">触发 JS 错误</button>
                <button class="btn btn-danger" onclick="triggerPromiseError()">触发 Promise 错误</button>
                <button class="btn btn-danger" onclick="triggerResourceError()">触发资源错误</button>
                <button class="btn btn-warning" onclick="captureManualError()">手动捕获错误</button>
            </div>
        </div>

        <!-- 用户行为测试 -->
        <div class="card">
            <h2>👆 用户行为追踪</h2>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="trackCustomEvent()">追踪自定义事件</button>
                <button class="btn btn-primary" onclick="trackButtonClick()">追踪按钮点击</button>
            </div>
            <div class="form-group" style="margin-top: 20px;">
                <label>模拟表单提交（追踪表单事件）：</label>
                <input type="text" id="testInput" placeholder="输入内容后点击提交">
            </div>
            <button class="btn btn-success" onclick="trackFormSubmit()">提交表单</button>
        </div>

        <!-- 接口监控测试 -->
        <div class="card">
            <h2>🌐 接口监控测试</h2>
            <div class="btn-group">
                <button class="btn btn-success" onclick="testXHR()">测试 XHR 请求</button>
                <button class="btn btn-success" onclick="testFetch()">测试 Fetch 请求</button>
                <button class="btn btn-danger" onclick="testErrorRequest()">测试错误请求</button>
            </div>
        </div>

        <!-- 页面导航 -->
        <div class="card">
            <h2>📄 页面导航（测试 PV 统计）</h2>
            <div class="nav-links">
                <a href="index.jsp">首页</a>
                <a href="list.jsp">列表页</a>
                <a href="detail.jsp?id=1">详情页</a>
                <a href="form.jsp">表单页</a>
            </div>
        </div>

        <!-- 日志输出 -->
        <div class="card">
            <h2>📋 操作日志</h2>
            <div id="logArea" class="log-area">
                <div class="log-item">
                    <span class="log-time">[<%= new SimpleDateFormat("HH:mm:ss").format(new Date()) %>]</span>
                    <span class="log-type">[初始化]</span>
                    监控 SDK 已加载，开始监控...
                </div>
            </div>
        </div>
    </div>

    <!-- 引入监控 SDK -->
    <script src="monitor-sdk.js"></script>
    <script>
        // 初始化监控 SDK
        // 注意：projectId 需要在管理端创建项目后获取
        var monitor = new Monitor({
            apiUrl: 'http://localhost:3000/api',
            projectId: 'project-jsp-test-001',  // 替换为你的项目ID
            userId: 'jsp-user-001',     // 可选：用户ID
            enableError: true,
            enablePerformance: true,
            enableBehavior: true,
            enableApi: true,
            sampleRate: 1  // 采样率 100%
        });

        // 日志输出函数
        function log(type, message) {
            var logArea = document.getElementById('logArea');
            var time = new Date().toTimeString().split(' ')[0];
            var typeClass = type === '错误' ? 'log-error' : 'log-type';
            var html = '<div class="log-item">' +
                '<span class="log-time">[' + time + ']</span> ' +
                '<span class="' + typeClass + '">[' + type + ']</span> ' +
                message +
                '</div>';
            logArea.innerHTML += html;
            logArea.scrollTop = logArea.scrollHeight;
        }

        // 错误监控测试
        function triggerJsError() {
            log('错误', '触发 JavaScript 错误...');
            // 故意触发错误
            throw new Error('这是一个测试的 JavaScript 错误');
        }

        function triggerPromiseError() {
            log('错误', '触发 Promise 错误...');
            Promise.reject(new Error('这是一个测试的 Promise 错误'));
        }

        function triggerResourceError() {
            log('错误', '触发资源加载错误...');
            var img = new Image();
            img.src = 'https://nonexistent-domain-12345.com/image.jpg';
        }

        function captureManualError() {
            try {
                // 模拟业务代码错误
                var obj = null;
                obj.doSomething();
            } catch (error) {
                monitor.captureError(error, {
                    action: '手动捕获',
                    page: 'index.jsp'
                });
                log('错误', '错误已手动捕获并上报');
                alert('错误已捕获并上报到监控系统');
            }
        }

        // 用户行为测试
        function trackCustomEvent() {
            monitor.track('custom_event', {
                action: 'click',
                button: 'trackCustomEvent',
                page: 'index.jsp'
            });
            log('行为', '自定义事件已追踪');
            alert('自定义事件已追踪');
        }

        function trackButtonClick() {
            monitor.track('button_click', {
                buttonId: 'trackButtonClick',
                buttonText: '追踪按钮点击',
                timestamp: new Date().toISOString()
            });
            log('行为', '按钮点击事件已追踪');
            alert('按钮点击事件已追踪');
        }

        function trackFormSubmit() {
            var inputValue = document.getElementById('testInput').value;
            monitor.track('form_submit', {
                formId: 'testForm',
                inputLength: inputValue.length,
                page: 'index.jsp'
            });
            log('行为', '表单提交事件已追踪，输入长度：' + inputValue.length);
            alert('表单提交事件已追踪');
        }

        // 接口监控测试
        function testXHR() {
            log('接口', '发起 XHR 请求...');
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://api.github.com/users/octocat');
            xhr.onload = function() {
                log('接口', 'XHR 请求成功，状态码：' + xhr.status);
                alert('XHR 请求成功，已监控');
            };
            xhr.onerror = function() {
                log('错误', 'XHR 请求失败');
            };
            xhr.send();
        }

        function testFetch() {
            log('接口', '发起 Fetch 请求...');
            fetch('https://api.github.com/users/octocat')
                .then(function(response) {
                    log('接口', 'Fetch 请求成功，状态码：' + response.status);
                    alert('Fetch 请求成功，已监控');
                })
                .catch(function(error) {
                    log('错误', 'Fetch 请求失败');
                });
        }

        function testErrorRequest() {
            log('接口', '发起错误请求...');
            fetch('https://nonexistent-domain-12345.com/api')
                .then(function(response) {
                    log('接口', '请求完成');
                })
                .catch(function(error) {
                    log('错误', '请求失败（已监控）');
                    alert('错误请求已监控');
                });
        }

        // 页面加载完成日志
        window.addEventListener('load', function() {
            log('性能', '页面加载完成，性能数据已采集');
        });
    </script>
</body>
</html>

