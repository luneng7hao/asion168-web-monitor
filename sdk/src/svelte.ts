/**
 * Svelte/SvelteKit 监控 SDK
 * 适配 Svelte 的编译器特性和响应式系统
 */

export interface MonitorConfig {
  apiUrl: string;
  projectId: string;
  userId?: string;
  enableError?: boolean;
  enablePerformance?: boolean;
  enableBehavior?: boolean;
  enableApi?: boolean;
  sampleRate?: number;
}

class SvelteMonitor {
  private config: MonitorConfig;
  private sessionId: string;
  private queue: any[] = [];
  private isSending = false;
  private initialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  init(config: MonitorConfig) {
    if (!config.projectId) {
      console.error('Monitor SDK: projectId 是必需的');
      return;
    }

    this.config = {
      enableError: true,
      enablePerformance: true,
      enableBehavior: true,
      enableApi: true,
      sampleRate: 1,
      ...config
    };

    this.initialized = true;

    if (typeof window !== 'undefined') {
      if (this.config.enableError) {
        this.initErrorMonitor();
      }
      if (this.config.enablePerformance) {
        this.initPerformanceMonitor();
      }
      if (this.config.enableBehavior) {
        this.initBehaviorMonitor();
      }
      if (this.config.enableApi) {
        this.initApiMonitor();
      }
    }

    console.log('✅ Svelte Monitor SDK initialized');
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 错误监控
  private initErrorMonitor() {
    // 统一的错误监听器，先判断是否是资源错误
    window.addEventListener('error', (event) => {
      if (!this.initialized || !this.config || Math.random() > (this.config.sampleRate || 1)) return;
      
      // 先检查是否是资源加载错误
      if (event.target && (event.target as HTMLElement).tagName) {
        const target = event.target as HTMLElement;
        if (['IMG', 'SCRIPT', 'LINK', 'VIDEO', 'AUDIO'].includes(target.tagName)) {
          // 资源加载错误
          const resourceUrl = (target as HTMLImageElement).src || 
                             (target as HTMLLinkElement).href || 
                             (target as HTMLScriptElement).src || 
                             (target as HTMLVideoElement).src || 
                             (target as HTMLAudioElement).src || '';
          
          // 关键修复：过滤 SDK 自身的上报请求，避免死循环
          if (this.isMonitorRequest(resourceUrl)) {
            return; // SDK 自身的请求失败，不进行错误上报，避免循环
          }
          
          this.captureError(new Error(`资源加载失败: ${resourceUrl}`), {
            type: 'resource',
            tagName: target.tagName,
            url: this.decodeUrl(window.location.href)
          });
          return; // 资源错误已处理，不再处理为 JS 错误
        }
      }
      
      // JavaScript 运行时错误
      if (event.error) {
        this.captureError(new Error(event.message), {
          type: 'js',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          url: this.decodeUrl(event.filename || window.location.href)
        });
      }
    }, true);

    // Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
      if (!this.config || Math.random() > (this.config.sampleRate || 1)) return;
      
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { 
          type: 'promise',
          url: this.decodeUrl(window.location.href)
        }
      );
    });
  }

  private decodeUrl(url: string): string {
    try {
      return decodeURIComponent(url);
    } catch (e) {
      return url;
    }
  }

  // 性能监控
  private initPerformanceMonitor() {
    if (document.readyState === 'complete') {
      this.collectPerformance();
    } else {
      window.addEventListener('load', () => this.collectPerformance());
    }
  }

  private collectPerformance() {
    if (Math.random() > (this.config.sampleRate || 1)) return;

    const timing = performance.timing;
    // 确保 loadEventEnd 已经准备好，否则延迟收集
    if (timing.loadEventEnd === 0) {
      setTimeout(() => this.collectPerformance(), 100);
      return;
    }
    
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    // 过滤无效数据（负数或超过60秒的数据）
    if (loadTime <= 0 || loadTime > 60000) return;
    
    const data: any = {
      loadTime,
      domReady: timing.domContentLoadedEventEnd > timing.navigationStart 
        ? timing.domContentLoadedEventEnd - timing.navigationStart 
        : undefined,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId
    };

    this.collectWebVitals(data);

    setTimeout(() => {
      this.send('/performance/report', data);
    }, 3000);
  }

  private collectWebVitals(data: any) {
    if (!('PerformanceObserver' in window)) return;

    try {
      new PerformanceObserver((list) => {
        const entry = list.getEntries().find((e: any) => e.name === 'first-contentful-paint');
        if (entry) data.fcp = Math.round(entry.startTime);
      }).observe({ entryTypes: ['paint'] });

      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as any;
        if (last) data.lcp = Math.round(last.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      new PerformanceObserver((list) => {
        const entry = list.getEntries()[0] as any;
        if (entry) data.fid = Math.round(entry.processingStart - entry.startTime);
      }).observe({ entryTypes: ['first-input'] });

      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
        data.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (e) {}
  }

  // 行为监控
  private initBehaviorMonitor() {
    this.trackPV();

    // SvelteKit 路由监控
    if (typeof window !== 'undefined') {
      // 监听 popstate
      window.addEventListener('popstate', () => this.trackPV());

      // 监听 pushState/replaceState
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        this.trackPV();
      };

      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args);
        this.trackPV();
      };
    }

    // 点击事件
    document.addEventListener('click', (event) => {
      if (Math.random() > (this.config.sampleRate || 1)) return;
      const target = event.target as HTMLElement;
      this.track('click', {
        element: target.tagName,
        text: target.textContent?.substring(0, 50)
      });
    }, true);
  }

  private trackPV() {
    this.track('pv', {
      url: window.location.href,
      path: window.location.pathname
    });
  }

  // 检查是否是监控 SDK 自身的请求
  private isMonitorRequest(url: string): boolean {
    if (!url || !this.config) return false;
    const apiUrl = this.config.apiUrl;
    // 移除查询参数和 hash，只比较基础 URL
    const urlWithoutQuery = url.split('?')[0].split('#')[0];
    const apiUrlWithoutQuery = apiUrl.split('?')[0].split('#')[0];
    
    // 检查完整 URL 是否以 apiUrl 开头（更精确的匹配）
    if (urlWithoutQuery.startsWith(apiUrlWithoutQuery)) {
      // 进一步检查是否是监控接口（包括带查询参数的情况）
      if (url.includes('/error/report') || 
          url.includes('/performance/report') || 
          url.includes('/behavior/report') || 
          url.includes('/api/report')) {
        return true;
      }
    }
    
    // 兼容性检查：即使 URL 不完全匹配，只要包含监控接口路径也认为是监控请求
    if (url.includes('/error/report') || 
        url.includes('/performance/report') || 
        url.includes('/behavior/report') || 
        url.includes('/api/report')) {
      return true;
    }
    
    // 过滤开发工具和热更新请求
    if (url.includes('.hot-update.') ||
        url.includes('/@vite/client') ||
        url.includes('/@react-refresh') ||
        url.includes('__vite_ping') ||
        url.includes('__webpack_hmr') ||
        url.includes('webpack-dev-server') ||
        url.includes('sockjs-node') ||
        url.startsWith('ws://') ||
        url.startsWith('wss://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('moz-extension://') ||
        url.startsWith('safari-extension://') ||
        url.startsWith('edge-extension://')) {
      return true;
    }
    
    return false;
  }

  // API 监控
  private initApiMonitor() {
    const self = this;
    const originalFetch = window.fetch;

    window.fetch = function(...args) {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || 'GET').toUpperCase();

      // 跳过监控 SDK 自身的请求
      if (self.isMonitorRequest(url)) {
        return originalFetch.apply(this, args);
      }

      return originalFetch.apply(this, args)
        .then((response) => {
          self.reportApi(url, method, response.status, Date.now() - startTime);
          return response;
        })
        .catch((error) => {
          self.reportApi(url, method, 0, Date.now() - startTime);
          throw error;
        });
    };
  }

  private reportApi(url: string, method: string, status: number, responseTime: number) {
    if (Math.random() > (this.config.sampleRate || 1)) return;
    // 关键修复：使用 isMonitorRequest 方法，更精确地过滤 SDK 自身请求
    if (this.isMonitorRequest(url)) return;

    this.send('/api/report', {
      url,
      method,
      status,
      responseTime,
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId
    });
  }

  // 公共方法
  captureError(error: Error, context?: any) {
    if (!this.initialized || !this.config || Math.random() > (this.config.sampleRate || 1)) return;

    const errorData: any = {
      type: context?.type || 'svelte',
      message: error.message,
      stack: error.stack,
      url: this.decodeUrl(typeof window !== 'undefined' ? window.location.href : ''),
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId
    };

    // 添加上下文信息
    if (context) {
      if (context.filename) errorData.line = context.lineno;
      if (context.lineno) errorData.line = context.lineno;
      if (context.colno) errorData.col = context.colno;
      if (context.component) errorData.componentName = context.component;
      if (context.props) errorData.props = context.props;
      if (context.tagName) errorData.tagName = context.tagName;
      if (context.route) errorData.route = context.route;
    }

    this.send('/error/report', errorData);
  }

  track(event: string, data?: any) {
    if (!this.initialized) return;

    // 自定义事件使用 'custom' 类型，但保留原始事件名在data中
    this.send('/behavior/report', {
      type: 'custom',
      url: window.location.href,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId,
      data: {
        eventName: event,
        ...data
      }
    });
  }

  // 追踪路由变化（公共方法）
  trackRouteChange(from?: string, to?: string, data?: any) {
    if (!this.initialized) return;
    
    this.send('/behavior/report', {
      type: 'route-change',
      url: window.location.href,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId,
      data: {
        from: from || document.referrer,
        to: to || window.location.pathname,
        ...data
      }
    });
  }

  setUser(userId: string) {
    if (this.config) {
      this.config.userId = userId;
    }
  }

  private send(endpoint: string, data: any) {
    if (!this.initialized) return;
    this.queue.push({ endpoint, data });
    this.flush();
  }

  /**
   * 优先使用 sendBeacon 或 img 方式上报数据
   */
  private sendData(endpoint: string, data: any): boolean {
    const url = `${this.config.apiUrl}${endpoint}`;
    const dataStr = JSON.stringify(data);
    
    // 方式1: 优先使用 navigator.sendBeacon
    if (typeof navigator !== 'undefined' && navigator.sendBeacon && dataStr.length < 65536) {
      try {
        const blob = new Blob([dataStr], { type: 'application/json' });
        if (navigator.sendBeacon(url, blob)) {
          return true;
        }
      } catch (e) {
        // sendBeacon 失败，继续尝试其他方式
      }
    }
    
    // 方式2: 使用 img 方式
    if (dataStr.length < 1500) {
      try {
        const img = new Image();
        const encodedData = encodeURIComponent(dataStr);
        const fullUrl = `${url}?data=${encodedData}`;
        
        // 关键修复：添加错误处理，避免触发资源错误监控
        img.onerror = () => {
          // 静默失败，不触发全局错误监听
          // 这是 SDK 自身的请求，失败不应该被当作资源错误上报
        };
        img.onload = () => {
          // 成功加载，清理
          setTimeout(() => {
            img.src = '';
          }, 100);
        };
        
        img.src = fullUrl;
        setTimeout(() => {
          img.src = '';
        }, 1000);
        return true;
      } catch (e) {
        // img 方式失败，继续尝试其他方式
      }
    }
    
    return false;
  }

  private async flush() {
    if (this.isSending || this.queue.length === 0) return;
    this.isSending = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      try {
        // 先尝试使用 sendBeacon 或 img
        const sent = this.sendData(item.endpoint, item.data);
        
        if (!sent) {
          // 如果前两种方式都不可用，使用 fetch
          await fetch(`${this.config.apiUrl}${item.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
            keepalive: true
          });
        }
      } catch (error) {
        this.queue.unshift(item);
        break;
      }
    }

    this.isSending = false;
  }
}

// Svelte Action - 用于组件级错误边界
export function monitorAction(node: HTMLElement, options?: { name?: string }) {
  const componentName = options?.name || 'unknown';

  const handleError = (event: ErrorEvent) => {
    monitor.captureError(new Error(event.message), {
      component: componentName,
      type: 'component-error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  };

  node.addEventListener('error', handleError as any);

  return {
    destroy() {
      node.removeEventListener('error', handleError as any);
    }
  };
}

// Svelte 5 onError 辅助函数
// 在 Svelte 5 组件中使用：
// import { onError } from 'svelte';
// import { handleSvelteError } from '@monitor/svelte';
// onError((error) => handleSvelteError(error, { component: 'ComponentName' }));
export function handleSvelteError(error: Error, context?: { component?: string; props?: any }) {
  monitor.captureError(error, {
    type: 'svelte-error',
    component: context?.component,
    props: context?.props,
    url: typeof window !== 'undefined' ? window.location.href : ''
  });
}

// SvelteKit hooks 辅助函数
// 在 hooks.server.ts 或 hooks.client.ts 中使用：
// import { handleError as monitorHandleError } from '@monitor/svelte';
// export function handleError({ error, event }) {
//   monitorHandleError({ error, event });
//   return { message: 'Internal Error' };
// }
export function handleError({ error, event }: { error: Error; event?: any }) {
  monitor.captureError(error, {
    type: 'sveltekit-error',
    url: event?.url?.href || (typeof window !== 'undefined' ? window.location.href : ''),
    route: event?.route?.id,
    status: event?.status
  });
}

// 单例实例
const monitor = new SvelteMonitor();

export default monitor;
export { SvelteMonitor };

