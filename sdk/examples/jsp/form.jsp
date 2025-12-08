<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSP 监控示例 - 表单页</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 600px; margin: 0 auto; }
        .card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .breadcrumb { margin-bottom: 20px; color: #666; }
        .breadcrumb a { color: #667eea; text-decoration: none; }
        h2 { color: #333; margin-bottom: 25px; }
        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        .form-group textarea { resize: vertical; min-height: 100px; }
        .btn {
            width: 100%;
            padding: 14px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .btn:hover { background: #5a6fd6; }
        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .message.success { background: #e8f5e9; color: #2e7d32; display: block; }
        .message.error { background: #ffebee; color: #c62828; display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="breadcrumb">
                <a href="index.jsp">首页</a> / 表单页
            </div>
            <h2>📝 用户反馈表单</h2>
            
            <div id="message" class="message"></div>
            
            <form id="feedbackForm" onsubmit="return handleSubmit(event)">
                <div class="form-group">
                    <label for="name">姓名 *</label>
                    <input type="text" id="name" name="name" required placeholder="请输入您的姓名">
                </div>
                
                <div class="form-group">
                    <label for="email">邮箱 *</label>
                    <input type="email" id="email" name="email" required placeholder="请输入您的邮箱">
                </div>
                
                <div class="form-group">
                    <label for="type">反馈类型</label>
                    <select id="type" name="type" onchange="trackFieldChange('type', this.value)">
                        <option value="suggestion">功能建议</option>
                        <option value="bug">Bug 反馈</option>
                        <option value="question">使用问题</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="content">反馈内容 *</label>
                    <textarea id="content" name="content" required placeholder="请详细描述您的反馈内容"></textarea>
                </div>
                
                <button type="submit" class="btn">提交反馈</button>
            </form>
        </div>
    </div>

    <script src="monitor-sdk.js"></script>
    <script>
        var monitor = new Monitor({
            apiUrl: 'http://localhost:3000/api',
            projectId: 'demo-project',
            userId: 'jsp-user-001'
        });

        var formStartTime = Date.now();

        // 追踪字段变化
        function trackFieldChange(field, value) {
            monitor.track('form_field_change', {
                formId: 'feedbackForm',
                field: field,
                value: value,
                page: 'form.jsp'
            });
        }

        // 输入框失焦时追踪
        document.querySelectorAll('input, textarea').forEach(function(el) {
            el.addEventListener('blur', function() {
                trackFieldChange(this.name, this.value ? '已填写' : '空');
            });
        });

        // 表单提交
        function handleSubmit(event) {
            event.preventDefault();
            
            var form = document.getElementById('feedbackForm');
            var formData = new FormData(form);
            var data = {};
            formData.forEach(function(value, key) {
                data[key] = value;
            });

            // 追踪表单提交
            monitor.track('form_submit', {
                formId: 'feedbackForm',
                formType: data.type,
                fillTime: Date.now() - formStartTime,
                page: 'form.jsp'
            });

            // 模拟提交
            var messageEl = document.getElementById('message');
            messageEl.className = 'message success';
            messageEl.textContent = '反馈提交成功！感谢您的反馈。';
            messageEl.style.display = 'block';

            // 重置表单
            form.reset();
            formStartTime = Date.now();

            return false;
        }
    </script>
</body>
</html>

