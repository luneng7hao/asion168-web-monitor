# 前端监控系统后端 - MidwayJS

基于 MidwayJS (Koa2) 的前端监控系统后端，采用 MongoDB + InfluxDB + Redis 架构。

## 技术架构

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

### 为什么这样设计？

1. **MongoDB**：适合存储结构化的文档数据，如项目配置、错误详情（包含堆栈信息）
2. **InfluxDB**：专为时序数据设计，查询性能优秀，适合存储监控指标
3. **Redis**：
   - 缓存热点数据，减少数据库压力
   - 实时计数（原子操作）
   - HyperLogLog 计算 UV

## 环境要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- InfluxDB >= 1.8
- Redis >= 6.0

## 快速开始

### 1. 安装依赖

```bash
cd backend-midway
npm install
```

### 2. 配置数据库

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
  client: {
    port: 6379,
    host: 'localhost',
  },
},

// InfluxDB
influxdb: {
  host: 'localhost',
  port: 8086,
  database: 'monitor',
},
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

服务将在 `http://localhost:3000` 启动。

## API 接口

### 项目管理

- `GET /api/project/list` - 获取项目列表
- `POST /api/project/create` - 创建项目
- `PUT /api/project/update/:id` - 更新项目
- `DELETE /api/project/delete/:id` - 删除项目

### 错误监控

- `POST /api/error/report` - 上报错误
- `GET /api/error/list` - 获取错误列表
- `GET /api/error/detail/:id` - 获取错误详情
- `GET /api/error/stats` - 获取错误统计

### 性能监控

- `POST /api/performance/report` - 上报性能数据
- `GET /api/performance/list` - 获取性能列表
- `GET /api/performance/stats` - 获取性能统计

### 用户行为

- `POST /api/behavior/report` - 上报用户行为
- `GET /api/behavior/stats` - 获取行为统计

### 接口监控

- `POST /api/api/report` - 上报接口数据
- `GET /api/api/stats` - 获取接口统计

### Dashboard

- `GET /api/dashboard/overview` - 获取概览数据

## 缓存策略

| 缓存项 | TTL | 说明 |
|-------|-----|------|
| Dashboard 数据 | 30s | 概览页面数据 |
| 统计数据 | 60s | 各模块统计数据 |
| 项目列表 | 5min | 项目基本信息 |
| 今日计数 | 到次日0点 | 实时计数数据 |

## 数据聚合

### 错误聚合

相同错误（根据 message + stack + url 生成 hash）会被聚合：
- 更新发生次数
- 记录首次/最后出现时间
- 统计影响用户数

### 性能聚合

InfluxDB 自动按时间聚合：
- 按天统计平均加载时间
- 计算 Web Vitals 平均值

## 目录结构

```
backend-midway/
├── src/
│   ├── config/           # 配置文件
│   ├── controller/       # 控制器
│   ├── entity/           # MongoDB 实体
│   ├── middleware/       # 中间件
│   └── service/          # 业务服务
│       ├── influxdb.service.ts   # InfluxDB 服务
│       ├── cache.service.ts      # Redis 缓存服务
│       ├── project.service.ts    # 项目服务
│       ├── error.service.ts      # 错误服务
│       ├── performance.service.ts # 性能服务
│       ├── behavior.service.ts   # 行为服务
│       ├── api-monitor.service.ts # 接口监控服务
│       └── dashboard.service.ts  # Dashboard 服务
├── package.json
└── tsconfig.json
```

## 扩展建议

1. **告警系统**：基于 Redis 的实时计数，当错误数超过阈值时发送告警
2. **数据清理**：定时任务清理过期数据
3. **数据导出**：支持导出报表
4. **权限控制**：添加用户认证和项目权限

