# 前端监控系统后端 - Spring Boot

基于 Spring Boot 3+ 的前端监控系统后端，采用 MongoDB + InfluxDB + Redis 架构。

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

- Java >= 17
- Maven >= 3.8
- MongoDB >= 6.0
- InfluxDB >= 2.0
- Redis >= 6.0
- Elasticsearch >= 8.0 (可选，用于日志查询)

## 快速开始

### 方式一：使用 Docker（推荐）

#### 1. 启动所有服务（包括数据库和应用）

```bash
cd backend-springboot
docker-compose up -d
```

这将启动：
- MongoDB (端口 27017)
- InfluxDB (端口 8086)
- Redis (端口 6379)
- Elasticsearch (端口 9200)
- Spring Boot 应用 (端口 3001)

#### 2. 查看日志

```bash
# 查看应用日志
docker-compose logs -f springboot-app

# 查看所有服务日志
docker-compose logs -f
```

#### 3. 停止服务

```bash
# 停止服务
docker-compose down

# 停止并删除数据卷（清理数据）
docker-compose down -v
```

#### 4. 仅启动依赖服务（本地运行应用）

如果只想启动数据库服务，在本地运行应用：

```bash
# 启动依赖服务
docker-compose -f docker-compose.dev.yml up -d

# 本地运行应用
mvn spring-boot:run
```

### 方式二：本地开发

#### 1. 配置数据库

修改 `src/main/resources/application.yml`：

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/monitor
    redis:
      host: localhost
      port: 6379

influxdb:
  url: http://localhost:8086
  token: your-token
  org: your-org
  bucket: monitor
```

#### 2. 编译项目

```bash
cd backend-springboot
mvn clean package
```

#### 3. 启动服务

```bash
# 开发模式
mvn spring-boot:run

# 生产模式
java -jar target/monitor-backend-springboot-1.0.0.jar
```

服务将在 `http://localhost:3001/api` 启动。

### Docker 环境说明

- **InfluxDB Token**: `monitor-token-123456` (在 `application-docker.yml` 中配置)
- **InfluxDB 初始化**: 首次启动会自动创建 org 和 bucket
- **网络**: 所有服务在同一 Docker 网络，使用服务名作为主机名
- **数据持久化**: 使用 Docker volumes 保存数据

## API 接口

### 项目管理

- `GET /api/project/list` - 获取项目列表
- `POST /api/project/create` - 创建项目
- `PUT /api/project/update/{id}` - 更新项目
- `DELETE /api/project/delete/{id}` - 删除项目

### 错误监控

- `POST /api/error/report` - 上报错误
- `GET /api/error/report?data=...` - 上报错误（GET方式，用于img上报）
- `GET /api/error/list?projectId=...` - 获取错误列表
- `GET /api/error/detail/{id}` - 获取错误详情
- `GET /api/error/stats?projectId=...` - 获取错误统计

### 性能监控

- `POST /api/performance/report` - 上报性能数据
- `GET /api/performance/report?data=...` - 上报性能数据（GET方式）
- `GET /api/performance/stats?projectId=...` - 获取性能统计

### 用户行为

- `POST /api/behavior/report` - 上报用户行为
- `GET /api/behavior/report?data=...` - 上报用户行为（GET方式）
- `GET /api/behavior/stats?projectId=...` - 获取行为统计

### 接口监控

- `POST /api/api/report` - 上报接口数据
- `GET /api/api/report?data=...` - 上报接口数据（GET方式）
- `GET /api/api/stats?projectId=...` - 获取接口统计

### Dashboard

- `GET /api/dashboard/overview?projectId=...` - 获取概览数据

### 健康检查

- `GET /api/health` - 健康检查

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
- 统计影响用户数（使用 Redis Set）

### 性能聚合

InfluxDB 自动按时间聚合：
- 按天统计平均加载时间
- 计算 Web Vitals 平均值

## 目录结构

```
backend-springboot/
├── src/
│   ├── main/
│   │   ├── java/com/monitor/
│   │   │   ├── config/           # 配置文件
│   │   │   ├── controller/       # 控制器
│   │   │   ├── entity/           # MongoDB 实体
│   │   │   ├── repository/       # MongoDB Repository
│   │   │   └── service/          # 业务服务
│   │   │       ├── InfluxDBService.java   # InfluxDB 服务
│   │   │       ├── CacheService.java      # Redis 缓存服务
│   │   │       ├── ProjectService.java    # 项目服务
│   │   │       ├── ErrorService.java       # 错误服务
│   │   │       ├── PerformanceService.java # 性能服务
│   │   │       ├── BehaviorService.java    # 行为服务
│   │   │       ├── ApiMonitorService.java  # 接口监控服务
│   │   │       └── DashboardService.java   # Dashboard 服务
│   │   └── resources/
│   │       ├── application.yml          # 本地开发配置
│   │       └── application-docker.yml   # Docker 环境配置
│   └── test/                      # 测试代码
├── Dockerfile                      # Docker 构建文件
├── docker-compose.yml              # Docker Compose 配置（包含应用）
├── docker-compose.dev.yml         # Docker Compose 配置（仅依赖服务）
├── .dockerignore                  # Docker 忽略文件
├── pom.xml                        # Maven 配置
└── README.md                      # 项目文档
```

## 与 Midway.js 后端的区别

1. **端口**：Spring Boot 默认运行在 `3001` 端口，Midway.js 运行在 `3000` 端口
2. **路径前缀**：Spring Boot 使用 `/api` 作为 context-path
3. **InfluxDB 版本**：Spring Boot 使用 InfluxDB 2.x 客户端，Midway.js 使用 1.x
4. **查询语言**：InfluxDB 2.x 使用 Flux 查询语言（当前版本简化处理，实际使用时需要实现 Flux 查询）

## 开发说明

### 待完善功能

1. **InfluxDB 查询**：当前版本简化了 InfluxDB 查询功能，实际使用时需要实现 Flux 查询语言
2. **时间趋势统计**：需要从 InfluxDB 查询时间趋势数据
3. **热门页面/接口统计**：需要实现 InfluxDB 聚合查询

### 扩展建议

1. 实现完整的 InfluxDB Flux 查询
2. 添加更多的统计维度
3. 实现数据导出功能
4. 添加告警功能
5. 实现数据清理策略

## 许可证

MIT

