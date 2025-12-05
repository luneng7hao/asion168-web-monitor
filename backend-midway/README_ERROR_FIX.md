# 关于 process.exit SIGINT 错误的说明

## 问题描述

在启动开发服务器时，可能会看到以下错误：

```
TypeError: The "code" argument must be of type number. Received type string ('SIGINT')
```

## 原因

这是 `@midwayjs/cli-plugin-dev` 在较新 Node.js 版本（Node.js 20+）中的一个已知 bug。当接收到 SIGINT 信号（Ctrl+C）时，插件错误地将字符串 'SIGINT' 传递给了 `process.exit()`，而新版本的 Node.js 要求退出码必须是数字。

## 影响

**这个错误不会影响应用的正常运行**，只是在关闭开发服务器时会出现这个警告。应用功能完全正常。

## 解决方案

### 方案 1：忽略此错误（推荐）

这个错误只是警告，不影响功能，可以安全忽略。

### 方案 2：使用生产模式启动（用于测试）

如果需要避免这个错误，可以使用生产模式启动：

```bash
npm run start
```

### 方案 3：等待官方修复

这个问题已经在 Midway.js 社区被报告，等待官方修复后升级 `@midwayjs/cli` 即可。

## 当前状态

- ✅ 应用可以正常启动
- ✅ 所有功能正常工作
- ✅ Redis 连接成功
- ⚠️ 仅在关闭服务器时显示警告（不影响功能）

