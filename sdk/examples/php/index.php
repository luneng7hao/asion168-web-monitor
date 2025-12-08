<?php
/**
 * PHP 前端监控 SDK 集成示例
 * 
 * 说明：前端监控 SDK 是纯 JavaScript 库，可以在任何 Web 页面中使用，
 * 包括 PHP 渲染的页面。只需在 HTML 中引入 SDK 脚本即可。
 */

// 模拟用户信息（实际项目中从 Session 或数据库获取）
$userId = 'php-user-' . substr(session_id() ?: uniqid(), 0, 8);
$serverTime = date('Y-m-d H:i:s');
$phpVersion = phpversion();
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP 监控示例 - 首页</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 14px;
            color: #166534;
            border-left: 4px solid #22c55e;
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
            border-bottom: 2px solid #11998e;
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
            background: #11998e;
            color: white;
        }
        .btn-primary:hover {
            background: #0d7d74;
        }
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        .btn-danger:hover {
            background: #dc2626;
        }
        .btn-success {
            background: #22c55e;
            color: white;
        }
        .btn-success:hover {
            background: #16a34a;
        }
        .btn-warning {
            background: #f59e0b;
            color: white;
        }
        .btn-warning:hover {
            background: #d97706;
        }
        .log-area {
            background: #1e293b;
            color: #e2e8f0;
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
            border-bottom: 1px solid #334155;
        }
        .log-area .log-time {
            color: #64748b;
        }
        .log-area .log-type {
            color: #22c55e;
            font-weight: bold;
        }
        .log-area .log-error {
            color: #ef4444;
        }
        .nav-links {
            margin-top: 20px;
        }
        .nav-links a {
            color: #11998e;
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
            border-color: #11998e;
        }
        .code-block {
            background: #1e293b;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow-x: auto;
            margin-top: 15px;
        }
        .code-block .comment {
            color: #64748b;
        }
        .code-block .keyword {
            color: #f472b6;
        }
        .code-block .string {
            color: #a5f3fc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐘 PHP 前端监控示例</h1>
            <p>这是一个使用监控 SDK 的 PHP 页面示例，演示如何在 PHP 项目中集成前端监控。</p>
            <div class="server-info">
                <strong>服务器信息：</strong><br>
                当前时间：<?php echo $serverTime; ?><br>
                PHP 版本：<?php echo $phpVersion; ?><br>
                用户 ID：<?php echo $userId; ?>
            </div>
        </div>

        <!-- 集成说明 -->
        <div class="card">
            <h2>📖 集成方式</h2>
            <p>只需在 PHP 页面的 HTML 中引入监控 SDK 脚本即可：</p>
            <div class="code-block">
                <span class="comment">&lt;!-- 方式1: 使用 CDN --&gt;</span><br>
                &lt;script src="<span class="string">https://your-cdn.com/monitor-sdk.js</span>"&gt;&lt;/script&gt;<br><br>
                <span class="comment">&lt;!-- 方式2: 本地文件 --&gt;</span><br>
                &lt;script src="<span class="string">/js/monitor-sdk.js</span>"&gt;&lt;/script&gt;<br><br>
                <span class="comment">&lt;!-- 初始化 --&gt;</span><br>
                &lt;script&gt;<br>
                &nbsp;&nbsp;<span class="keyword">var</span> monitor = <span class="keyword">new</span> Monitor({<br>
                &nbsp;&nbsp;&nbsp;&nbsp;apiUrl: <span class="string">'http://localhost:3000/api'</span>,<br>
                &nbsp;&nbsp;&nbsp;&nbsp;projectId: <span class="string">'your-project-id'</span>,<br>
                &nbsp;&nbsp;&nbsp;&nbsp;userId: <span class="string">'&lt;?php echo $userId; ?&gt;'</span><br>
                &nbsp;&nbsp;});<br>
                &lt;/script&gt;
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
                <a href="index.php">首页</a>
                <a href="list.php">列表页</a>
                <a href="detail.php?id=1">详情页</a>
                <a href="form.php">表单页</a>
            </div>
        </div>

        <!-- 日志输出 -->
        <div class="card">
            <h2>📋 操作日志</h2>
            <div id="logArea" class="log-area">
                <div class="log-item">
                    <span class="log-time">[<?php echo date('H:i:s'); ?>]</span>
                    <span class="log-type">[初始化]</span>
                    监控 SDK 已加载，开始监控...
                </div>
            </div>
        </div>
    </div>

    <!-- 引入监控 SDK -->
    <script src="../monitor-sdk.js"></script>
    <script>
        // 初始化监控 SDK
        // 使用 PHP 变量传递用户信息
        var monitor = new Monitor({
            apiUrl: 'http://localhost:3000/api',
            projectId: 'demo-project',
            userId: '<?php echo $userId; ?>',
            enableError: true,
            enablePerformance: true,
            enableBehavior: true,
            enableApi: true,
            sampleRate: 1
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
                var obj = null;
                obj.doSomething();
            } catch (error) {
                monitor.captureError(error, {
                    action: '手动捕获',
                    page: 'index.php'
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
                page: 'index.php'
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
                page: 'index.php'
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
                .catch(function(error) {
                    log('错误', '请求失败（已监控）');
                    alert('错误请求已监控');
                });
        }

        window.addEventListener('load', function() {
            log('性能', '页面加载完成，性能数据已采集');
        });
    </script>
</body>
</html>

