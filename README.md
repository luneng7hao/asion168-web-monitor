# Asion168 Web Monitor

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Java Version](https://img.shields.io/badge/java-%3E%3D17-orange.svg)

一个完整的前端监控解决方案，支持错误监控、性能分析、用户行为追踪和接口监控。

[English](./README.en.md) | 中文

</div>

## ✨ 特性

- 🐛 **错误监控** - 自动捕获 JavaScript 错误、资源加载错误、Promise 错误
- ⚡ **性能监控** - 页面加载时间、Web Vitals (FCP, LCP, FID, CLS)、资源加载分析
- 👤 **用户行为** - PV/UV 统计、点击追踪、路由变化监控
- 🔌 **接口监控** - API 请求成功率、响应时间、错误统计
- 📊 **数据可视化** - 实时 Dashboard、趋势图表、详细分析报告
- 🔍 **日志查询** - 基于 Elasticsearch 的日志检索和分析
- 📱 **多平台支持** - Web、微信小程序、React、Vue2/3、Svelte
- 🚀 **开箱即用** - Docker 一键部署，支持本地开发和生产环境

## 🏗️ 技术架构

### 后端技术栈

- **MidwayJS** (Node.js) - 推荐使用，功能完整
- **Spring Boot** (Java) - 企业级后端实现
- **MongoDB** - 存储错误详情和项目信息
- **InfluxDB** - 时序数据存储（性能、行为、接口监控）
- **Redis** - 缓存和实时计数
- **Elasticsearch** - 日志查询和分析

### 前端技术栈

- **Vue 3** + **TypeScript** + **Vite**
- **Element Plus** - UI 组件库
- **ECharts** - 数据可视化

### SDK 支持

- ✅ Web (原生 JavaScript，适用于 HTML、JSP、PHP 等传统 Web 应用)
- ✅ 微信小程序
- ✅ React
- ✅ Vue 2/3
- ✅ Svelte

## 📦 项目结构

```
Asion168-web-monitor/
├── backend-midway/      # MidwayJS 后端（推荐）
│   ├── src/
│   │   ├── controller/  # API 控制器
│   │   ├── service/     # 业务服务
│   │   ├── entity/      # MongoDB 实体
│   │   └── config/      # 配置文件
│   ├── docker-compose.yml
│   └── package.json
├── backend-springboot/  # Spring Boot 后端
│   ├── src/
│   │   └── main/java/com/monitor/
│   ├── docker-compose.yml
│   └── pom.xml
├── frontend/            # Vue3 管理端
│   ├── src/
│   │   ├── views/       # 页面组件
│   │   ├── api/         # API 接口
│   │   └── router/      # 路由配置
│   └── package.json
├── sdk/                 # 监控 SDK
│   ├── src/
│   │   ├── index.ts     # Web 版 SDK
│   │   ├── miniprogram.ts # 小程序版 SDK
│   │   ├── vue.ts       # Vue 插件
│   │   ├── react.ts     # React 插件
│   │   └── svelte.ts    # Svelte 插件
│   ├── examples/        # 使用示例（包含 Web、JSP、PHP、Vue、React、Svelte、小程序等测试工程）
│   └── package.json
└── README.md
```

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- Java >= 17 (如果使用 Spring Boot 后端)
- Docker & Docker Compose (推荐)
- MongoDB >= 6.0
- InfluxDB >= 2.0
- Redis >= 6.0
- Elasticsearch >= 8.0 (可选)

### 方式一：使用 Docker（推荐）

#### 1. 启动 MidwayJS 后端

```bash
# 克隆项目
git clone https://gitee.com/luneng17hao/asion168-web-monitor.git
或 git clone https://github.com/luneng7hao/asion168-web-monitor.git
cd asion168-web-monitor

# 启动后端服务（包含数据库）
cd backend-midway
docker-compose up -d

# 安装依赖并启动应用
npm install
npm run dev
```

后端服务将在 `http://localhost:3000` 启动

#### 2. 启动 Spring Boot 后端（可选）

```bash
cd backend-springboot
docker-compose up -d
```

后端服务将在 `http://localhost:3001` 启动

#### 3. 启动前端管理端

```bash
cd frontend
npm install
npm run dev
```

前端管理端将在 `http://localhost:5173` 启动

### 方式二：本地开发

#### 1. 启动数据库服务

使用 Docker Compose 启动数据库：

```bash
cd backend-midway
docker-compose up -d mongodb influxdb redis elasticsearch
```

或手动安装并启动：
- MongoDB: 端口 27017
- InfluxDB: 端口 8086
- Redis: 端口 6379
- Elasticsearch: 端口 9200

#### 2. 配置后端

修改 `backend-midway/src/config/config.default.ts`：

```typescript
export default {
  // MongoDB 配置
  typegoose: {
    dataSource: {
      default: {
        uri: 'mongodb://localhost:27017/monitor',
      },
    },
  },
  // InfluxDB 配置
  influxdb: {
    host: 'localhost',
    port: 8086,
    database: 'monitor',
  },
  // Redis 配置
  redis: {
    clients: {
      default: {
        host: 'localhost',
        port: 6379,
      },
    },
  },
}
```

#### 3. 启动服务

```bash
# 后端
cd backend-midway
npm install
npm run dev

# 前端
cd frontend
npm install
npm run dev
```

## 📖 使用 SDK

### Web 项目

```bash
cd sdk
npm install
npm run build
```

在项目中引入：

```javascript
import Monitor from '@asion168/monitor-sdk'

const monitor = new Monitor({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001',  // 默认项目ID
  userId: 'user-123' // 可选
})

// 自动开始监控
monitor.init()
```

### Vue 3 项目

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { VueMonitor } from '@asion168/monitor-sdk/vue'

const app = createApp(App)

app.use(VueMonitor, {
  apiUrl: 'http://localhost:3000/api',
  projectId: '001'
})

app.mount('#app')
```

### React 项目

```javascript
import React from 'react'
import { ReactMonitor } from '@asion168/monitor-sdk/react'

function App() {
  ReactMonitor.init({
    apiUrl: 'http://localhost:3000/api',
    projectId: '001'
  })
  
  return <div>Your App</div>
}
```

### 微信小程序

```javascript
import MiniProgramMonitor from '@asion168/monitor-sdk/miniprogram'

MiniProgramMonitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001'
})
```

## 📚 测试工程示例

项目提供了多个测试工程，方便快速上手和测试：

### Web 测试工程

- **`examples/web/`** - 原生 JavaScript 测试工程（适用于 HTML、JSP、PHP 等传统 Web 应用）
- **`examples/jsp/`** - JSP 测试工程，演示如何在 JSP 项目中集成监控 SDK
- **`examples/php/`** - PHP 测试工程，演示如何在 PHP 项目中集成监控 SDK

### 框架测试工程

- **`examples/vue3/`** - Vue 3 测试工程
- **`examples/vue2/`** - Vue 2 测试工程
- **`examples/react/`** - React 测试工程
- **`examples/svelte/`** - Svelte 测试工程

### 小程序测试工程

- **`examples/miniprogram/`** - 微信小程序测试工程，演示小程序监控 SDK 的使用

每个测试工程都包含：
- 完整的集成示例
- 错误测试页面
- 性能测试页面
- 行为追踪示例
- 详细的 README 说明

更多示例请查看 [sdk/examples](./sdk/examples/) 目录。

## 📊 数据存储架构

| 数据类型 | 存储方式 | 说明 |
|---------|---------|------|
| 错误详情 | MongoDB | 错误堆栈、上下文、聚合信息 |
| 性能数据 | InfluxDB | 时序数据，便于趋势分析 |
| 用户行为 | InfluxDB | PV/UV、点击等时序统计 |
| 接口监控 | InfluxDB | 响应时间、成功率时序数据 |
| 统计缓存 | Redis | Dashboard、统计数据缓存 |
| 实时计数 | Redis | 今日错误数、PV/UV 实时计数 |
| 监控日志 | Elasticsearch | 日志查询和分析 |

## 🔧 配置说明

### 单项目模式

系统默认使用单项目模式，所有数据使用项目ID `001`。如需多项目支持，可以修改后端代码。

### 环境变量

后端环境变量配置：

```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/monitor

# InfluxDB
INFLUXDB_HOST=localhost
INFLUXDB_PORT=8086
INFLUXDB_DATABASE=monitor

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

## 📚 文档

- [后端文档 - MidwayJS](./backend-midway/README.md)
- [后端文档 - Spring Boot](./backend-springboot/README.md)
- [SDK 文档](./sdk/README.md)
- [小程序使用指南](./sdk/miniprogram-usage.md)

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告问题** - 在 [Issues](https://github.com/luneng17hao/asion168-web-monitor/issues) 中报告 Bug 或提出功能建议
2. **提交代码** - Fork 项目，创建功能分支，提交 Pull Request
3. **改进文档** - 帮助完善文档和示例代码
4. **分享使用经验** - 在 Discussions 中分享使用心得

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 添加必要的注释和文档
- 编写单元测试（如果可能）

## 📝 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

## 🗺️ 路线图

- [ ] 支持多项目模式
- [ ] 添加告警功能
- [ ] 支持数据导出
- [ ] 性能优化和缓存策略改进
- [ ] 添加更多图表类型
- [ ] 支持自定义 Dashboard
- [ ] 添加用户权限管理

## ❓ 常见问题

### Q: 如何切换多项目模式？

A: 当前版本为单项目模式，所有数据使用项目ID `001`。如需多项目支持，需要修改后端代码，添加项目管理和数据隔离逻辑。

### Q: 数据存储在哪里？

A: 错误详情存储在 MongoDB，性能和行为数据存储在 InfluxDB，缓存数据存储在 Redis，日志数据存储在 Elasticsearch。

### Q: 如何清理历史数据？

A: 可以使用数据清理接口或直接操作数据库。MidwayJS 后端提供了 `/api/data-cleanup/clear-all` 接口。

### Q: 支持哪些浏览器？

A: SDK 支持所有现代浏览器（Chrome、Firefox、Safari、Edge 等），需要支持 ES6+ 和 Promise。

## 📄 许可证

本项目采用 [MIT](./LICENSE) 许可证。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

## 📮 联系方式

- 项目地址: [Gitee](https://gitee.com/luneng17hao/asion168-web-monitor)
- 问题反馈: [Issues](https://gitee.com/luneng17hao/asion168-web-monitor/issues)
- 讨论区: [Pull Requests](https://gitee.com/luneng17hao/asion168-web-monitor/pulls)

---

<div align="center">

如果这个项目对你有帮助，请给一个 ⭐ Star

Made with ❤️ by Asion168

</div>
