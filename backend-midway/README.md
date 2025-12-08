# 前端监控系统后端 - MidwayJS

基于 MidwayJS (Koa2) 的前端监控系统后端，采用 MongoDB + InfluxDB + Redis + Elasticsearch 架构。

## 📋 目录

- [技术架构](#技术架构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [API 接口](#api-接口)
- [配置说明](#配置说明)
- [数据存储](#数据存储)
- [缓存策略](#缓存策略)
- [目录结构](#目录结构)
- [开发指南](#开发指南)

## 🏗️ 技术架构

### 数据存储策略

| 数据类型 | 存储方式 | 说明 |
|---------|---------|------|
| 项目信息 | MongoDB | 项目基本信息、配置 |
| 错误详情 | MongoDB | 错误堆栈、上下文、聚合信息 |
| 性能数据 | InfluxDB | 时序数据，便于趋势分析 |
| 用户行为 | InfluxDB | PV/UV、点击等时序统计 |
| 接口监控 | InfluxDB | 响应时间、成功率时序数据 |
| 统计缓存 | Redis | Dashboard、统计数据缓存 |
| 实时计数 | Redis | 今日错误数、PV/UV 实时计数 |
| 监控日志 | Elasticsearch | 日志查询和分析 |

### 为什么这样设计？

1. **MongoDB**：适合存储结构化的文档数据，如项目配置、错误详情（包含堆栈信息）
2. **InfluxDB**：专为时序数据设计，查询性能优秀，适合存储监控指标
3. **Redis**：
   - 缓存热点数据，减少数据库压力
   - 实时计数（原子操作）
   - HyperLogLog 计算 UV
4. **Elasticsearch**：强大的日志检索和分析能力

## 📦 环境要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- InfluxDB >= 1.8
- Redis >= 6.0
- Elasticsearch >= 8.0 (可选，用于日志查询)

## 🚀 快速开始

### 方式一：使用 Docker（推荐）

#### 1. 启动所有服务（包括数据库和应用）

```bash
cd backend-midway
docker-compose up -d
```

这将启动：
- MongoDB (端口 27017)
- InfluxDB (端口 8086)
- Redis (端口 6379)
- Elasticsearch (端口 9200)

#### 2. 安装依赖并启动应用

```bash
npm install
npm run dev
```

服务将在 `http://localhost:3000` 启动。

#### 3. 查看日志

```bash
# 查看应用日志
docker-compose logs -f

# 查看所有服务日志
docker-compose logs -f mongodb influxdb redis elasticsearch
```

#### 4. 停止服务

```bash
# 停止服务
docker-compose down

# 停止并删除数据卷（清理数据）
docker-compose down -v
```

### 方式二：本地开发

#### 1. 安装依赖

```bash
cd backend-midway
npm install
```

#### 2. 配置数据库

修改 `src/config/config.default.ts`：

```typescript
// MongoDB
typegoose: {
  dataSource: {
    default: {
      uri: 'mongodb://localhost:27017/monitor',
    },
  },
},

// Redis
redis: {
  clients: {
    default: {
      port: 6379,
      host: 'localhost',
      password: '',
      db: 0,
    },
  },
},

// InfluxDB
influxdb: {
  host: 'localhost',
  port: 8086,
  database: 'monitor',
  username: '',
  password: '',
},

// Elasticsearch
elasticsearch: {
  node: 'http://localhost:9200',
},
```

#### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

服务将在 `http://localhost:3000` 启动。

## 📡 API 接口

### 项目管理

- `GET /api/project/list` - 获取项目列表
- `POST /api/project/create` - 创建项目
- `PUT /api/project/update/:id` - 更新项目
- `DELETE /api/project/delete/:id` - 删除项目

### 错误监控

- `POST /api/error/report` - 上报错误
- `GET /api/error/report?data=...` - 上报错误（GET方式，用于img上报）
- `GET /api/error/list?projectId=...` - 获取错误列表
- `GET /api/error/detail/:id` - 获取错误详情
- `GET /api/error/stats?projectId=...` - 获取错误统计

### 性能监控

- `POST /api/performance/report` - 上报性能数据
- `GET /api/performance/report?data=...` - 上报性能数据（GET方式）
- `GET /api/performance/list?projectId=...` - 获取性能列表
- `GET /api/performance/stats?projectId=...` - 获取性能统计

### 用户行为

- `POST /api/behavior/report` - 上报用户行为
- `GET /api/behavior/report?data=...` - 上报用户行为（GET方式）
- `GET /api/behavior/stats?projectId=...&type=...` - 获取行为统计
- `GET /api/behavior/events?projectId=...` - 获取行为事件列表

### 接口监控

- `POST /api/api/report` - 上报接口数据
- `GET /api/api/report?data=...` - 上报接口数据（GET方式）
- `GET /api/api/stats?projectId=...` - 获取接口统计
- `GET /api/api/errors?projectId=...` - 获取接口错误详情

### Dashboard

- `GET /api/dashboard/overview?projectId=...` - 获取概览数据

### 日志查询

- `GET /api/log/search?projectId=...&keyword=...` - 搜索日志
- `POST /api/log/test` - 测试日志写入
- `GET /api/log/stats` - 获取日志统计

### 数据清理

- `POST /api/data-cleanup/clear-all` - 清除所有数据
- `POST /api/data-cleanup/delete-old?days=30` - 删除指定天数前的数据

### 健康检查

- `GET /api/health` - 健康检查

## ⚙️ 配置说明

### 单项目模式

系统默认使用单项目模式，所有数据使用项目ID `001`。可以在 `config.default.ts` 中配置：

```typescript
// 默认项目ID（单项目模式）
defaultProjectId: '001',
```

### 环境变量

支持通过环境变量配置：

```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/monitor

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# InfluxDB
INFLUXDB_HOST=localhost
INFLUXDB_PORT=8086
INFLUXDB_DATABASE=monitor

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

### CORS 配置

默认允许所有来源，生产环境建议配置：

```typescript
cors: {
  origin: 'https://your-domain.com',
  allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  credentials: true,
},
```

## 💾 数据存储

### MongoDB

存储错误详情和项目信息：

```typescript
// 错误实体
{
  projectId: string,
  type: string,        // js, promise, resource
  message: string,
  stack: string,
  url: string,
  errorHash: string,  // 错误指纹
  count: number,      // 发生次数
  affectedUsers: number
}
```

### InfluxDB

存储时序数据：

- **measurement: performance** - 性能数据
- **measurement: behavior** - 用户行为
- **measurement: api_monitor** - 接口监控
- **measurement: error_count** - 错误计数

### Redis

缓存和计数：

- `monitor:dashboard:{projectId}` - Dashboard 数据缓存
- `monitor:error:stats:{projectId}` - 错误统计缓存
- `monitor:performance:stats:{projectId}` - 性能统计缓存
- `monitor:behavior:stats:{projectId}` - 行为统计缓存
- `monitor:api:stats:{projectId}` - 接口统计缓存
- `monitor:today:error:{projectId}` - 今日错误数
- `monitor:today:pv:{projectId}` - 今日PV
- `monitor:uv:{projectId}` - UV计数（HyperLogLog）

### Elasticsearch

存储监控日志，支持全文搜索：

- **index: monitor-logs** - 所有监控日志

## 🔄 缓存策略

| 缓存项 | TTL | 说明 |
|-------|-----|------|
| Dashboard 数据 | 30s | 概览页面数据 |
| 统计数据 | 60s | 各模块统计数据 |
| 项目列表 | 5min | 项目基本信息 |
| 今日计数 | 到次日0点 | 实时计数数据 |

## 📁 目录结构

```
backend-midway/
├── src/
│   ├── config/              # 配置文件
│   │   ├── config.default.ts
│   │   └── config.local.ts
│   ├── controller/          # 控制器
│   │   ├── error.controller.ts
│   │   ├── performance.controller.ts
│   │   ├── behavior.controller.ts
│   │   ├── api-monitor.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── log.controller.ts
│   │   └── data-cleanup.controller.ts
│   ├── entity/               # MongoDB 实体
│   │   ├── error.entity.ts
│   │   └── project.entity.ts
│   ├── middleware/          # 中间件
│   │   └── cors.middleware.ts
│   ├── service/              # 业务服务
│   │   ├── influxdb.service.ts
│   │   ├── cache.service.ts
│   │   ├── elasticsearch.service.ts
│   │   ├── error.service.ts
│   │   ├── performance.service.ts
│   │   ├── behavior.service.ts
│   │   ├── api-monitor.service.ts
│   │   └── dashboard.service.ts
│   ├── utils/                # 工具函数
│   │   └── date.util.ts
│   └── configuration.ts      # 应用配置
├── docker-compose.yml         # Docker Compose 配置
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 开发指南

### 添加新的监控类型

1. 创建对应的 Service
2. 创建对应的 Controller
3. 在 InfluxDB Service 中添加写入方法
4. 更新 Dashboard Service

### 数据聚合

#### 错误聚合

相同错误（根据 message + stack + url 生成 hash）会被聚合：
- 更新发生次数
- 记录首次/最后出现时间
- 统计影响用户数（使用 Redis Set）

#### 性能聚合

InfluxDB 自动按时间聚合：
- 按天统计平均加载时间
- 计算 Web Vitals 平均值

### 定时任务

系统支持定时数据清理，可以在 `DataCleanupService` 中配置：

```typescript
// 每天凌晨2点清理30天前的数据
@Schedule({
  cron: '0 0 2 * * *',
})
async deleteOldData() {
  // 清理逻辑
}
```

## 📚 相关文档

- [项目主文档](../README.md)
- [Spring Boot 后端文档](../backend-springboot/README.md)
- [SDK 文档](../sdk/README.md)
- [前端文档](../frontend/README.md)

## 🐛 问题排查

### MongoDB 连接失败

检查 MongoDB 是否启动：
```bash
docker ps | grep mongo
# 或
mongosh mongodb://localhost:27017/monitor
```

### InfluxDB 连接失败

检查 InfluxDB 是否启动：
```bash
curl http://localhost:8086/ping
```

### Redis 连接失败

检查 Redis 是否启动：
```bash
redis-cli ping
```

### Elasticsearch 连接失败

检查 Elasticsearch 是否启动：
```bash
curl http://localhost:9200
```

## 📄 许可证

MIT

## 🔗 相关链接

- [项目主页](https://gitee.com/luneng17hao/asion168-web-monitor)
- [问题反馈](https://gitee.com/luneng17hao/asion168-web-monitor/issues)
- [贡献指南](../CONTRIBUTING.md)
