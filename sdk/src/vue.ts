/**
 * Vue 监控 SDK
 * 适配 Vue 2.x 和 Vue 3.x，利用 Vue 内置的错误处理机制
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

interface ErrorData {
  type: string;
  message: string;
  stack?: string;
  url: string;
  line?: number;
  col?: number;
  timestamp: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  projectId: string;
  componentName?: string;
  componentStack?: string;
  props?: any;
}

interface PerformanceData {
  loadTime: number;
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  projectId: string;
}

interface BehaviorData {
  type: string;
  url: string;
  path?: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  projectId: string;
  data?: any;
}

interface ApiData {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: string;
  userId?: string;
  sessionId: string;
  projectId: string;
  requestData?: any;
  responseData?: any;
}

class VueMonitor {
  private config: MonitorConfig | null = null;
  private sessionId: string = '';
  private queue: any[] = [];
  private isSending = false;
  private initialized = false;
  private vueApp: any = null;
  private router: any = null;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * 初始化监控（Vue 2.x）
   */
  initVue2(Vue: any, router?: any, config: MonitorConfig) {
    this.init(config);
    this.router = router;
    
    // Vue 2.x 错误处理
    // 保存原有的错误处理器（如果有）
    const originalErrorHandler = Vue.config.errorHandler;
    
    Vue.config.errorHandler = (err: Error, vm: any, info: string) => {
      // 先调用监控 SDK 的错误处理
      this.handleVueError(err, vm, info);
      
      // 如果有原有的错误处理器，调用它
      if (originalErrorHandler) {
        originalErrorHandler(err, vm, info);
      } else {
        // 如果没有原有处理器，只记录到控制台，不显示错误界面
        console.error('Vue Error:', err, info);
      }
      
      // 不抛出错误，防止页面崩溃
      // 错误已经被上报到监控系统
    };

    // Vue 2.x 警告处理
    Vue.config.warnHandler = (msg: string, vm: any, trace: string) => {
      if (this.config?.enableError && Math.random() <= (this.config.sampleRate || 1)) {
        this.reportError({
          type: 'vue-warning',
          message: msg,
          stack: trace,
          componentName: vm?.$options?.name || vm?.$options?.__name,
          componentStack: this.getComponentStack(vm)
        });
      }
    };

    // 路由监听
    if (router) {
      router.beforeEach((to: any, from: any, next: any) => {
        this.trackBehavior('route-change', {
          from: from.path,
          to: to.path
        });
        next();
      });
    }

    console.log('✅ Vue 2 Monitor SDK initialized');
  }

  /**
   * 初始化监控（Vue 3.x）
   */
  initVue3(app: any, router?: any, config: MonitorConfig) {
    this.init(config);
    this.vueApp = app;
    this.router = router;
    
    // Vue 3.x 错误处理
    app.config.errorHandler = (err: Error, instance: any, info: string) => {
      this.handleVueError(err, instance, info);
    };

    // Vue 3.x 警告处理
    app.config.warnHandler = (msg: string, instance: any, trace: string) => {
      if (this.config?.enableError && Math.random() <= (this.config.sampleRate || 1)) {
        this.reportError({
          type: 'vue-warning',
          message: msg,
          stack: trace,
          componentName: instance?.type?.name || instance?.type?.__name,
          componentStack: this.getComponentStack(instance)
        });
      }
    };

    // 路由监听
    if (router) {
      router.beforeEach((to: any, from: any) => {
        this.trackBehavior('route-change', {
          from: from.path,
          to: to.path
        });
      });
    }

    console.log('✅ Vue 3 Monitor SDK initialized');
  }

  private init(config: MonitorConfig) {
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
      if (this.config.enablePerformance) {
        this.initPerformanceMonitor();
      }

      if (this.config.enableBehavior) {
        this.initBehaviorMonitor();
      }

      if (this.config.enableApi) {
        this.initApiMonitor();
      }

      // 全局错误捕获
      if (this.config.enableError) {
        this.initErrorMonitor();
      }
    }
  }

  private generateSessionId(): string {
    // 尝试从 localStorage 获取已存在的 sessionId
    const storageKey = 'monitor_session_id';
    if (typeof window !== 'undefined' && window.localStorage) {
      const existingSessionId = localStorage.getItem(storageKey);
      if (existingSessionId) {
        return existingSessionId;
      }
    }
    
    // 生成新的 sessionId 并保存
    const newSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(storageKey, newSessionId);
    }
    return newSessionId;
  }

  private decodeUrl(url: string): string {
    try {
      return decodeURIComponent(url);
    } catch (e) {
      return url;
    }
  }

  private handleVueError(err: Error, instance: any, info: string) {
    if (!this.config || !this.initialized || Math.random() > (this.config.sampleRate || 1)) {
      return;
    }

    const componentName = this.getComponentName(instance);
    const componentStack = this.getComponentStack(instance);

    this.reportError({
      type: 'vue-error',
      message: err.message,
      stack: err.stack || info,
      componentName,
      componentStack,
      props: this.getComponentProps(instance)
    });
  }

  private getComponentName(instance: any): string | undefined {
    if (!instance) return undefined;
    
    // Vue 2.x
    if (instance.$options) {
      return instance.$options.name || instance.$options.__name;
    }
    
    // Vue 3.x
    if (instance.type) {
      return instance.type.name || instance.type.__name;
    }
    
    return undefined;
  }

  private getComponentStack(instance: any): string | undefined {
    if (!instance) return undefined;
    
    try {
      // Vue 2.x
      if (instance.$vnode) {
        return this.formatComponentStack(instance.$vnode);
      }
      
      // Vue 3.x
      if (instance.vnode) {
        return this.formatComponentStack(instance.vnode);
      }
    } catch (e) {
      // 忽略错误
    }
    
    return undefined;
  }

  private formatComponentStack(vnode: any): string {
    const stack: string[] = [];
    let current = vnode;
    
    while (current) {
      const name = current.componentOptions?.Ctor?.options?.name || 
                   current.type?.name || 
                   current.tag;
      if (name) {
        stack.push(name);
      }
      current = current.parent;
    }
    
    return stack.reverse().join(' -> ');
  }

  private getComponentProps(instance: any): any {
    if (!instance) return undefined;
    
    try {
      // Vue 2.x
      if (instance.$props) {
        return instance.$props;
      }
      
      // Vue 3.x
      if (instance.props) {
        return instance.props;
      }
    } catch (e) {
      // 忽略错误
    }
    
    return undefined;
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
          
          this.reportError({
            type: 'resource',
            message: `资源加载失败: ${resourceUrl}`,
            url: this.decodeUrl(window.location.href)
          });
          return; // 资源错误已处理，不再处理为 JS 错误
        }
      }
      
      // JavaScript 运行时错误
      if (event.error) {
        this.reportError({
          type: 'js',
          message: event.message,
          stack: event.error?.stack,
          url: this.decodeUrl(event.filename || window.location.href),
          line: event.lineno,
          col: event.colno
        });
      }
    }, true);

    // Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
      if (!this.config || Math.random() > (this.config.sampleRate || 1)) return;
      
      this.reportError({
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        url: this.decodeUrl(window.location.href)
      });
    });
  }

  // 性能监控
  private initPerformanceMonitor() {
    if (document.readyState === 'complete') {
      this.collectPerformance();
    } else {
      window.addEventListener('load', () => {
        this.collectPerformance();
      });
    }
  }

  private collectPerformance() {
    if (!this.config || Math.random() > (this.config.sampleRate || 1)) return;

    const timing = performance.timing;
    if (timing.loadEventEnd === 0) {
      setTimeout(() => this.collectPerformance(), 100);
      return;
    }
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    if (loadTime <= 0 || loadTime > 60000) return;

    const performanceData: PerformanceData = {
      loadTime,
      url: this.decodeUrl(window.location.href),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId
    };

    // Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find((entry: any) => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            performanceData.fcp = Math.round(fcpEntry.startTime);
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {}

      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            performanceData.lcp = Math.round(lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {}

      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fidEntry = entries[0] as any;
          if (fidEntry) {
            performanceData.fid = Math.round(fidEntry.processingStart - fidEntry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {}
    }

    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        performanceData.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {}

    setTimeout(() => {
      this.reportPerformance(performanceData);
    }, 3000);
  }

  // 用户行为监控
  private initBehaviorMonitor() {
    this.trackBehavior('pv', {
      url: this.decodeUrl(window.location.href),
      path: this.decodeUrl(window.location.pathname)
    });

    document.addEventListener('click', (event) => {
      if (!this.config || Math.random() > (this.config.sampleRate || 1)) return;
      
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.trackBehavior('click', {
        url: this.decodeUrl(window.location.href),
        path: this.decodeUrl(window.location.pathname),
        element: target.tagName,
        elementId: target.id || '',
        className: target.className || '',
        text: target.textContent?.substring(0, 100) || '',
        position: {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2)
        },
        timestamp: new Date().toISOString()
      });
    }, true);
  }

  // 接口监控
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
    // Vite HMR
    if (url.includes('.hot-update.') || 
        url.includes('/@vite/client') ||
        url.includes('/@react-refresh') ||
        url.includes('__vite_ping')) {
      return true;
    }
    
    // Webpack HMR
    if (url.includes('__webpack_hmr') ||
        url.includes('webpack-dev-server') ||
        url.includes('sockjs-node')) {
      return true;
    }
    
    // WebSocket 连接（HMR 通常使用 WebSocket）
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return true;
    }
    
    // 浏览器扩展和开发工具
    if (url.startsWith('chrome-extension://') ||
        url.startsWith('moz-extension://') ||
        url.startsWith('safari-extension://') ||
        url.startsWith('edge-extension://')) {
      return true;
    }
    
    return false;
  }

  private initApiMonitor() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = function(...args) {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';

      if (self.isMonitorRequest(url)) {
        return originalFetch.apply(this, args);
      }

      return originalFetch.apply(this, args)
        .then((response) => {
          const responseTime = Date.now() - startTime;
          
          if (self.config && Math.random() <= (self.config.sampleRate || 1)) {
            self.reportApi({
              url,
              method,
              status: response.status,
              responseTime,
              timestamp: new Date().toISOString(),
              userId: self.config.userId,
              sessionId: self.sessionId,
              projectId: self.config.projectId
            });
          }
          
          return response;
        })
        .catch((error) => {
          const responseTime = Date.now() - startTime;
          
          if (self.config && Math.random() <= (self.config.sampleRate || 1)) {
            self.reportApi({
              url,
              method,
              status: 0,
              responseTime,
              timestamp: new Date().toISOString(),
              userId: self.config.userId,
              sessionId: self.sessionId,
              projectId: self.config.projectId
            });
          }
          
          throw error;
        });
    }

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      this._monitorUrl = typeof url === 'string' ? url : url.toString();
      this._monitorMethod = method;
      return originalOpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(...args: any[]) {
      const startTime = Date.now();
      const url = this._monitorUrl;
      const method = this._monitorMethod;

      if (self.isMonitorRequest(url)) {
        return originalSend.apply(this, args);
      }

      this.addEventListener('loadend', function() {
        const responseTime = Date.now() - startTime;
        
        if (self.config && Math.random() <= (self.config.sampleRate || 1)) {
          self.reportApi({
            url,
            method,
            status: this.status,
            responseTime,
            timestamp: new Date().toISOString(),
            userId: self.config.userId,
            sessionId: self.sessionId,
            projectId: self.config.projectId
          });
        }
      });

      return originalSend.apply(this, args);
    };
  }

  // 上报方法
  private reportError(data: Partial<ErrorData>) {
    if (!this.config) return;
    
    const errorData: ErrorData = {
      type: data.type || 'js',
      message: data.message || 'Unknown error',
      stack: data.stack,
      url: this.decodeUrl(data.url || window.location.href),
      line: data.line,
      col: data.col,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId,
      componentName: data.componentName,
      componentStack: data.componentStack,
      props: data.props
    };
    
    this.send('/error/report', errorData);
  }

  private reportPerformance(data: PerformanceData) {
    this.send('/performance/report', data);
  }

  private trackBehavior(type: string, data?: any) {
    if (!this.config) return;
    
    const behaviorData: BehaviorData = {
      type,
      url: this.decodeUrl(window.location.href),
      path: this.decodeUrl(window.location.pathname),
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId,
      data: {
        ...data,
        // 添加更多上下文信息
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        screenSize: typeof window !== 'undefined' ? {
          width: window.screen.width,
          height: window.screen.height
        } : {},
        viewportSize: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : {},
        referrer: typeof document !== 'undefined' ? (document.referrer || '') : ''
      }
    };
    
    this.send('/behavior/report', behaviorData);
  }

  private reportApi(data: ApiData) {
    this.send('/api/report', data);
  }

  private send(endpoint: string, data: any) {
    if (!this.config || !this.initialized) return;
    this.queue.push({ endpoint, data });
    this.flush();
  }

  /**
   * 优先使用 sendBeacon 或 img 方式上报数据
   */
  private sendData(endpoint: string, data: any): boolean {
    if (!this.config) return false;
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
    if (this.isSending || this.queue.length === 0 || !this.config) return;
    
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
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(item.data),
            keepalive: true
          });
        }
      } catch (error) {
        console.error('Monitor SDK: Failed to send data', error);
        this.queue.unshift(item);
        break;
      }
    }
    
    this.isSending = false;
  }

  // 手动上报错误
  public captureError(error: Error, context?: any) {
    this.reportError({
      type: 'js',
      message: error.message,
      stack: error.stack,
      url: this.decodeUrl(window.location.href),
      ...context
    });
  }

  // 手动追踪行为
  public track(event: string, data?: any) {
    // 自定义事件使用 'custom' 类型，但保留原始事件名在data中
    this.trackBehavior('custom', {
      eventName: event,
      ...data
    });
  }
}

// 单例
const monitor = new VueMonitor();

export default monitor;

// Vue 2.x 插件
export const Vue2Plugin = {
  install(Vue: any, options: { router?: any; config: MonitorConfig }) {
    monitor.initVue2(Vue, options.router, options.config);
  }
};

// Vue 3.x 插件
export const Vue3Plugin = {
  install(app: any, options: { router?: any; config: MonitorConfig }) {
    monitor.initVue3(app, options.router, options.config);
  }
};

