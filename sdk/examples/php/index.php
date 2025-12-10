<?php
// 获取用户ID（示例）
$userId = isset($_SESSION['userId']) ? $_SESSION['userId'] : 'php-user-' . uniqid();
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP 监控 SDK 测试</title>
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
            max-width: 1200px;
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
            background: #d4941e;
        }
        .btn-info {
            background: #909399;
            color: white;
        }
        .btn-info:hover {
            background: #7a7d82;
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
        .log-item {
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #444;
        }
        .log-time {
            color: #888;
        }
        .log-type {
            color: #67c23a;
            font-weight: bold;
        }
        .log-error {
            color: #f56c6c;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐘 PHP 监控 SDK 测试</h1>
            <p>这是一个使用通用 Web 监控 SDK 的 PHP 测试页面。</p>
            <p style="margin-top: 10px; color: #666;">用户ID: <?php echo htmlspecialchars($userId); ?></p>
        </div>

        <!-- 错误监控测试 -->
        <div class="card">
            <h2>🐛 错误监控测试</h2>
            <div class="btn-group">
                <button class="btn btn-danger" id="btn-trigger-js-error">触发 JS 错误</button>
                <button class="btn btn-danger" id="btn-trigger-promise-error">触发 Promise 错误</button>
                <button class="btn btn-danger" id="btn-trigger-resource-error">触发资源错误</button>
                <button class="btn btn-danger" id="btn-capture-manual-error">手动捕获错误</button>
            </div>
        </div>

        <!-- 用户行为测试 -->
        <div class="card">
            <h2>👆 用户行为追踪</h2>
            <div class="btn-group">
                <button class="btn btn-primary" id="btn-track-custom-event">追踪自定义事件</button>
                <button class="btn btn-primary" id="btn-track-button-click">追踪按钮点击</button>
            </div>
        </div>

        <!-- 接口监控测试 -->
        <div class="card">
            <h2>🌐 接口监控测试</h2>
            <div class="btn-group">
                <button class="btn btn-success" id="btn-test-success-api">测试成功 API 请求</button>
                <button class="btn btn-success" id="btn-test-xhr">测试 XHR 请求</button>
                <button class="btn btn-success" id="btn-test-fetch">测试 Fetch 请求</button>
                <button class="btn btn-danger" id="btn-test-error-request">测试错误请求</button>
            </div>
        </div>

        <!-- 性能监控测试 -->
        <div class="card">
            <h2>⚡ 性能监控测试</h2>
            <p>性能数据会在页面加载时自动收集，包括：</p>
            <ul style="margin-top: 10px; padding-left: 20px; margin-bottom: 15px;">
                <li>页面加载时间</li>
                <li>首次内容绘制 (FCP)</li>
                <li>最大内容绘制 (LCP)</li>
                <li>首次输入延迟 (FID)</li>
                <li>累积布局偏移 (CLS)</li>
            </ul>
            <div class="btn-group">
                <button class="btn btn-primary" id="btn-reload-page">重新加载页面（测试性能）</button>
                <button class="btn btn-warning" id="btn-simulate-heavy-task">模拟重任务（测试性能）</button>
                <button class="btn btn-success" id="btn-test-fid">测试 FID（点击此按钮）</button>
                <button class="btn btn-info" id="btn-test-cls">测试 CLS（布局偏移）</button>
            </div>
            <div id="performance-metrics" style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px; display: none;">
                <h3 style="margin-bottom: 15px; color: #333;">当前性能指标</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div><strong>页面加载时间：</strong><span id="metric-loadTime">-</span>ms</div>
                    <div><strong>首次内容绘制 (FCP)：</strong><span id="metric-fcp">-</span>ms</div>
                    <div><strong>最大内容绘制 (LCP)：</strong><span id="metric-lcp">-</span>ms</div>
                    <div><strong>首次输入延迟 (FID)：</strong><span id="metric-fid">-</span>ms</div>
                    <div><strong>累积布局偏移 (CLS)：</strong><span id="metric-cls">-</span></div>
                </div>
            </div>
        </div>

        <!-- 日志输出 -->
        <div class="card">
            <h2>📋 操作日志</h2>
            <div id="logArea" class="log-area">
                <div class="log-item">
                    <span class="log-time">[初始化]</span>
                    <span class="log-type">[INFO]</span>
                    监控 SDK 已加载，开始监控...
                </div>
            </div>
        </div>
    </div>

    <!-- 引入监控 SDK -->
    <script src="js/monitor/index.js"></script>
    <script>
        // 使用全局变量 window.Monitor
        const monitor = new window.Monitor({
            apiUrl: 'http://localhost:3000/api',
            projectId: '001',
            userId: '<?php echo htmlspecialchars($userId, ENT_QUOTES, 'UTF-8'); ?>',
            enableError: true,
            enablePerformance: true,
            enableBehavior: true,
            enableApi: true,
            sampleRate: 1
        });

        // 将 monitor 暴露到全局，方便测试函数使用
        window.monitor = monitor;

        // 日志输出函数
        function log(type, message) {
            const logArea = document.getElementById('logArea');
            const time = new Date().toTimeString().split(' ')[0];
            const typeClass = type === '错误' ? 'log-error' : 'log-type';
            const html = '<div class="log-item">' +
                '<span class="log-time">[' + time + ']</span> ' +
                '<span class="' + typeClass + '">[' + type + ']</span> ' +
                message +
                '</div>';
            logArea.innerHTML += html;
            logArea.scrollTop = logArea.scrollHeight;
        }

        // 错误监控测试
        window.triggerJsError = function() {
            log('错误', '触发 JavaScript 错误...');
            throw new Error('这是一个测试的 JavaScript 错误');
        };

        window.triggerPromiseError = function() {
            log('错误', '触发 Promise 错误...');
            Promise.reject(new Error('这是一个测试的 Promise 错误'));
        };

        window.triggerResourceError = function() {
            log('错误', '正在触发资源加载错误...');
            const img = document.createElement('img');
            img.src = 'https://nonexistent-domain-12345.com/image.jpg';
            img.style.display = 'none';
            img.onerror = function() {
                log('错误', '资源加载错误已触发，已上报到监控系统');
                setTimeout(function() {
                    if (img.parentNode) {
                        img.parentNode.removeChild(img);
                    }
                }, 1000);
            };
            document.body.appendChild(img);
        };

        window.captureManualError = function() {
            try {
                const obj = null;
                obj.doSomething();
            } catch (error) {
                monitor.captureError(error, {
                    action: '手动捕获',
                    page: 'index.php'
                });
                log('错误', '错误已手动捕获并上报');
                alert('错误已捕获并上报到监控系统');
            }
        };

        // 用户行为测试
        window.trackCustomEvent = function() {
            monitor.track('custom_event', {
                action: 'click',
                button: 'trackCustomEvent',
                page: 'index.php'
            });
            log('行为', '自定义事件已追踪');
            alert('自定义事件已追踪');
        };

        window.trackButtonClick = function() {
            monitor.track('button_click', {
                buttonId: 'trackButtonClick',
                buttonText: '追踪按钮点击',
                timestamp: new Date().toISOString()
            });
            log('行为', '按钮点击事件已追踪');
            alert('按钮点击事件已追踪');
        };

        // 接口监控测试
        window.testSuccessApi = function() {
            log('接口', '发起成功 API 请求...');
            fetch('http://localhost:3000/api/dashboard/overview')
                .then(function(response) {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('请求失败');
                })
                .then(function(data) {
                    log('接口', 'API 请求成功，状态码：200，已监控');
                    alert('成功 API 请求已完成，已监控！');
                })
                .catch(function(error) {
                    log('错误', 'API 请求失败：' + error.message);
                    alert('请求失败，请确保后端服务正在运行');
                });
        };

        window.testXHR = function() {
            log('接口', '发起 XHR 请求...');
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://api.github.com/users/octocat');
            xhr.onload = function() {
                log('接口', 'XHR 请求成功，状态码：' + xhr.status);
                alert('XHR 请求成功，已监控');
            };
            xhr.onerror = function() {
                log('错误', 'XHR 请求失败');
            };
            xhr.send();
        };

        window.testFetch = function() {
            log('接口', '发起 Fetch 请求...');
            fetch('https://api.github.com/users/octocat')
                .then(function(response) {
                    log('接口', 'Fetch 请求成功，状态码：' + response.status);
                    alert('Fetch 请求成功，已监控');
                })
                .catch(function(error) {
                    log('错误', 'Fetch 请求失败');
                });
        };

        window.testErrorRequest = function() {
            log('接口', '发起错误请求...');
            fetch('https://nonexistent-domain-12345.com/api')
                .then(function(response) {
                    log('接口', '请求完成');
                })
                .catch(function(error) {
                    log('错误', '请求失败（已监控）');
                    alert('错误请求已监控');
                });
        };

        // 性能监控测试函数
        window.reloadPage = function() {
            log('性能', '重新加载页面以测试性能数据采集...');
            window.location.reload();
        };

        window.simulateHeavyTask = function() {
            log('性能', '开始模拟重任务...');
            const startTime = Date.now();
            let result = 0;
            for (let i = 0; i < 10000000; i++) {
                result += Math.sqrt(i);
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            log('性能', '重任务完成，耗时：' + duration + 'ms');
            alert('重任务完成，耗时：' + duration + 'ms');
        };

        window.testFID = function() {
            log('性能', '测试 FID（首次输入延迟）- 点击此按钮即可触发');
            alert('FID 测试：点击此按钮时，SDK 会自动测量首次输入延迟。请查看性能监控页面查看结果。');
        };

        window.testCLS = function() {
            log('性能', '测试 CLS（累积布局偏移）...');
            const img = document.createElement('img');
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY3ZWVhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q0xTIFRlc3Q8L3RleHQ+PC9zdmc+';
            img.style.width = '400px';
            img.style.height = '300px';
            img.style.margin = '20px';
            img.style.border = '2px solid #667eea';
            img.style.borderRadius = '8px';
            
            const container = document.querySelector('.container');
            if (container) {
                container.appendChild(img);
                log('性能', '已插入图片，模拟布局偏移');
                alert('已插入图片模拟布局偏移。CLS 值会由 SDK 自动测量。');
            }
        };

        // 实时显示性能指标
        function updatePerformanceMetrics() {
            if (typeof PerformanceObserver === 'undefined') {
                return;
            }

            const metricsDiv = document.getElementById('performance-metrics');
            if (!metricsDiv) return;

            metricsDiv.style.display = 'block';

            if (performance.timing && performance.timing.loadEventEnd) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                const loadTimeEl = document.getElementById('metric-loadTime');
                if (loadTimeEl) loadTimeEl.textContent = loadTime;
            }

            try {
                const fcpObserver = new PerformanceObserver(function(list) {
                    const entries = list.getEntries();
                    const fcpEntry = entries.find(function(entry) {
                        return entry.name === 'first-contentful-paint';
                    });
                    if (fcpEntry) {
                        const fcpEl = document.getElementById('metric-fcp');
                        if (fcpEl) fcpEl.textContent = Math.round(fcpEntry.startTime);
                    }
                });
                fcpObserver.observe({ entryTypes: ['paint'] });
            } catch (e) {}

            try {
                const lcpObserver = new PerformanceObserver(function(list) {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                        const lcpEl = document.getElementById('metric-lcp');
                        if (lcpEl) lcpEl.textContent = Math.round(lastEntry.startTime);
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {}

            try {
                const fidObserver = new PerformanceObserver(function(list) {
                    const entries = list.getEntries();
                    const fidEntry = entries[0];
                    if (fidEntry && fidEntry.processingStart && fidEntry.startTime) {
                        const fidEl = document.getElementById('metric-fid');
                        if (fidEl) fidEl.textContent = Math.round(fidEntry.processingStart - fidEntry.startTime);
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {}

            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver(function(list) {
                    for (let i = 0; i < list.getEntries().length; i++) {
                        const entry = list.getEntries()[i];
                        if (!entry.hadRecentInput && entry.value) {
                            clsValue += entry.value;
                        }
                    }
                    const clsEl = document.getElementById('metric-cls');
                    if (clsEl) clsEl.textContent = clsValue.toFixed(2);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {}
        }

        window.addEventListener('load', function() {
            log('性能', '页面加载完成，性能数据已采集');
            setTimeout(updatePerformanceMetrics, 500);
        });

        function bindEvents() {
            const btnTriggerJsError = document.getElementById('btn-trigger-js-error');
            const btnTriggerPromiseError = document.getElementById('btn-trigger-promise-error');
            const btnTriggerResourceError = document.getElementById('btn-trigger-resource-error');
            const btnCaptureManualError = document.getElementById('btn-capture-manual-error');
            const btnTrackCustomEvent = document.getElementById('btn-track-custom-event');
            const btnTrackButtonClick = document.getElementById('btn-track-button-click');
            const btnTestSuccessApi = document.getElementById('btn-test-success-api');
            const btnTestXhr = document.getElementById('btn-test-xhr');
            const btnTestFetch = document.getElementById('btn-test-fetch');
            const btnTestErrorRequest = document.getElementById('btn-test-error-request');
            const btnReloadPage = document.getElementById('btn-reload-page');
            const btnSimulateHeavyTask = document.getElementById('btn-simulate-heavy-task');
            const btnTestFid = document.getElementById('btn-test-fid');
            const btnTestCls = document.getElementById('btn-test-cls');

            if (btnTriggerJsError) btnTriggerJsError.addEventListener('click', window.triggerJsError);
            if (btnTriggerPromiseError) btnTriggerPromiseError.addEventListener('click', window.triggerPromiseError);
            if (btnTriggerResourceError) btnTriggerResourceError.addEventListener('click', window.triggerResourceError);
            if (btnCaptureManualError) btnCaptureManualError.addEventListener('click', window.captureManualError);
            if (btnTrackCustomEvent) btnTrackCustomEvent.addEventListener('click', window.trackCustomEvent);
            if (btnTrackButtonClick) btnTrackButtonClick.addEventListener('click', window.trackButtonClick);
            if (btnTestSuccessApi) btnTestSuccessApi.addEventListener('click', window.testSuccessApi);
            if (btnTestXhr) btnTestXhr.addEventListener('click', window.testXHR);
            if (btnTestFetch) btnTestFetch.addEventListener('click', window.testFetch);
            if (btnTestErrorRequest) btnTestErrorRequest.addEventListener('click', window.testErrorRequest);
            if (btnReloadPage) btnReloadPage.addEventListener('click', window.reloadPage);
            if (btnSimulateHeavyTask) btnSimulateHeavyTask.addEventListener('click', window.simulateHeavyTask);
            if (btnTestFid) btnTestFid.addEventListener('click', window.testFID);
            if (btnTestCls) btnTestCls.addEventListener('click', window.testCLS);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindEvents);
        } else {
            bindEvents();
        }
    </script>
</body>
</html>

