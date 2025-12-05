import { Middleware, IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';

@Middleware()
export class CorsMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 允许的源列表（开发环境）
      const allowedOrigins = [
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
      ];

      // 获取请求的 Origin
      const origin = ctx.get('Origin');
      
      // 如果请求头中有 Origin 且在允许列表中，则使用该 Origin
      // 否则不设置 Access-Control-Allow-Origin（浏览器会拒绝，但这是安全的）
      if (origin && allowedOrigins.includes(origin)) {
        ctx.set('Access-Control-Allow-Origin', origin);
        ctx.set('Access-Control-Allow-Credentials', 'true');
      } else if (origin) {
        // 开发环境：允许所有本地开发源
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          ctx.set('Access-Control-Allow-Origin', origin);
          ctx.set('Access-Control-Allow-Credentials', 'true');
        }
      } else {
        // 没有 Origin 头（可能是同源请求或非浏览器请求），不设置 CORS 头
      }

      ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      ctx.set('Access-Control-Max-Age', '86400'); // 24小时

      if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        return;
      }

      await next();
    };
  }

  static getName(): string {
    return 'cors';
  }
}

