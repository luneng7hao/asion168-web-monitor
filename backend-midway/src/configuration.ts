import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import * as redis from '@midwayjs/redis';
import * as swagger from '@midwayjs/swagger';
import * as mongoose from 'mongoose';
import { join } from 'path';
import { CorsMiddleware } from './middleware/cors.middleware';

@Configuration({
  imports: [
    koa,
    validate,
    redis,
    swagger,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  async onReady() {
    // 连接 MongoDB
    try {
      await mongoose.connect('mongodb://localhost:27017/monitor');
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
    }

    // 添加全局中间件
    this.app.useMiddleware([CorsMiddleware]);
    
    console.log('🚀 监控后端服务已启动');
    console.log('📊 MongoDB + InfluxDB + Redis 已配置');
    console.log('📖 Swagger 文档: http://localhost:3000/swagger-ui/index.html');
  }
}

