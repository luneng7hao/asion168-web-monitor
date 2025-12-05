// 本地运行时，config.local.ts 会覆盖 config.default.ts 中同名配置
export default {
  mongoose: {
    dataSource: {
      default: {
        uri: 'mongodb://localhost:27017/monitor_dev',
        entities: ['./entity/*.entity.ts'],
      },
    },
  },
  influxdb: {
    host: 'localhost',
    port: 8086,
    database: 'monitor_dev',
  },
};

