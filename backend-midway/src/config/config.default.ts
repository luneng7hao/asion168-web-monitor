// 默认配置
export default {
  keys: 'monitor-backend-secret-key',
  koa: {
    port: 3000,
    globalPrefix: '/api',
  },
  cors: {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true,
  },
  // MongoDB 配置 (typegoose)
  typegoose: {
    dataSource: {
      default: {
        uri: 'mongodb://localhost:27017/monitor',
        entities: [require('../entity/error.entity').ErrorLog],
      },
    },
  },
  // Redis 配置
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
  // InfluxDB 配置
  influxdb: {
    host: 'localhost',
    port: 8086,
    database: 'monitor',
    username: '',
    password: '',
  },
  // Elasticsearch 配置
  elasticsearch: {
    node: 'http://localhost:9200',
    // 如果需要认证，取消下面的注释
    // auth: {
    //   username: 'elastic',
    //   password: 'your-password'
    // }
  },
  // 缓存配置
  cache: {
    // 统计数据缓存时间（秒）
    statsTTL: 60,
    // Dashboard 缓存时间（秒）
    dashboardTTL: 30,
  },
  // 默认项目ID（单项目模式）
  defaultProjectId: '001',
  // Swagger 配置
  swagger: {
    title: '前端监控系统 API',
    description: '前端监控系统后端接口文档',
    version: '1.0.0',
    tagSortable: true,
    tags: [
      { name: 'error', description: '错误监控' },
      { name: 'performance', description: '性能监控' },
      { name: 'behavior', description: '用户行为' },
      { name: 'api', description: '接口监控' },
      { name: 'dashboard', description: '仪表盘' },
      { name: 'log', description: '监控日志' },
    ],
  },
};

