# PHP 项目集成前端监控 SDK

## 概述

前端监控 SDK 是纯 JavaScript 库，可以在任何 Web 页面中使用，包括 PHP 渲染的页面。

## 快速集成

### 1. 引入 SDK

在 PHP 页面的 `</body>` 前添加：

```html
<script src="/path/to/monitor-sdk.js"></script>
```

### 2. 初始化

```html
<script>
var monitor = new Monitor({
    apiUrl: 'http://your-monitor-server/api',
    projectId: 'your-project-id',
    userId: '<?php echo $userId; ?>',  // 可从 PHP 传递用户信息
    enableError: true,
    enablePerformance: true,
    enableBehavior: true,
    enableApi: true
});
</script>
```

### 3. PHP 变量传递

可以将 PHP 变量传递给 SDK：

```php
<?php
$userId = $_SESSION['user_id'] ?? 'anonymous';
$pageInfo = [
    'page' => basename($_SERVER['PHP_SELF']),
    'category' => 'product'
];
?>
<script>
var monitor = new Monitor({
    apiUrl: 'http://localhost:3000/api',
    projectId: 'my-php-project',
    userId: '<?php echo htmlspecialchars($userId); ?>',
    metadata: <?php echo json_encode($pageInfo); ?>
});
</script>
```

## 示例文件

- `index.php` - 首页示例
- `list.php` - 列表页示例  
- `detail.php` - 详情页示例
- `form.php` - 表单页示例

## 运行示例

```bash
# 使用 PHP 内置服务器
cd sdk/examples/php
php -S localhost:8080
```

然后访问 http://localhost:8080/index.php

