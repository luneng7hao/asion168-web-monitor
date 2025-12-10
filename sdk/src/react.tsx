/**
 * React 监控 SDK
 * 适配 React，利用 React 的错误边界（Error Boundary）机制
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

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
  componentStack?: string;
  errorInfo?: string;
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

class ReactMonitor {
  private config: MonitorConfig | null = null;
  private sessionId: string = '';
  private queue: any[] = [];
  private isSending = false;
  private initialized = false;
  private router: any = null;
  private reportedErrors: Map<string, number> = new Map(); // 用于去重的错误记录

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * 初始化监控
   */
  init(config: MonitorConfig, router?: any) {
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

    this.router = router;
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

      // 路由监听
      if (router) {
        this.initRouterMonitor();
      }
    }

    console.log('✅ React Monitor SDK initialized');
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

  // 路由监听
  private initRouterMonitor() {
    if (!this.router) return;

    // React Router v5
    if (this.router.listen) {
      this.router.listen((location: any) => {
        this.trackBehavior('route-change', {
          path: location.pathname,
          search: location.search
        });
      });
    }

    // React Router v6
    if (this.router.subscribe) {
      this.router.subscribe((state: any) => {
        this.trackBehavior('route-change', {
          path: state.location.pathname,
          search: state.location.search
        });
      });
    }

    // 使用 history 监听
    if (window.history && window.history.pushState) {
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      window.history.pushState = function(...args) {
        originalPushState.apply(window.history, args);
        window.dispatchEvent(new Event('popstate'));
      };

      window.history.replaceState = function(...args) {
        originalReplaceState.apply(window.history, args);
        window.dispatchEvent(new Event('popstate'));
      };

      window.addEventListener('popstate', () => {
        this.trackBehavior('route-change', {
          path: window.location.pathname,
          search: window.location.search
        });
      });
    }
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
          
          // 检查是否在短时间内已经上报过相同的资源错误（去重）
          const errorKey = `resource:${resourceUrl}`;
          if (this.isDuplicateError(errorKey)) {
            return;
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
        // 检查是否是 React 组件错误（通常包含 React 相关的堆栈信息）
        // 如果是 React 组件错误，应该由 ErrorBoundary 处理，这里跳过
        const errorStack = event.error?.stack || '';
        if (errorStack.includes('ErrorBoundary') || errorStack.includes('componentDidCatch')) {
          return; // 跳过已经被 ErrorBoundary 捕获的错误
        }
        
        // 检查是否在短时间内已经上报过相同的错误（去重）
        const errorKey = `js:${event.message}:${event.lineno}:${event.colno}`;
        if (this.isDuplicateError(errorKey)) {
          return;
        }
        
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
      
      // 检查是否在短时间内已经上报过相同的错误（去重）
      const errorKey = `promise:${event.reason?.message || String(event.reason)}`;
      if (this.isDuplicateError(errorKey)) {
        return;
      }
      
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
    };

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

  // 检查是否是重复错误（1秒内的相同错误视为重复）
  private isDuplicateError(errorKey: string): boolean {
    const now = Date.now();
    const lastReportTime = this.reportedErrors.get(errorKey);
    
    if (lastReportTime && (now - lastReportTime) < 1000) {
      return true; // 1秒内重复的错误
    }
    
    // 记录本次上报时间
    this.reportedErrors.set(errorKey, now);
    
    // 清理过期的记录（超过5秒的记录）
    if (this.reportedErrors.size > 100) {
      for (const [key, time] of this.reportedErrors.entries()) {
        if (now - time > 5000) {
          this.reportedErrors.delete(key);
        }
      }
    }
    
    return false;
  }

  // 上报方法
  reportError(data: Partial<ErrorData>) {
    if (!this.config) return;
    
    // 生成错误唯一标识用于去重
    const errorKey = `${data.type || 'js'}:${data.message || 'Unknown error'}:${data.stack?.substring(0, 100) || ''}`;
    if (this.isDuplicateError(errorKey)) {
      console.log('⏭️ Duplicate error skipped:', errorKey);
      return; // 跳过重复错误
    }
    
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
      componentStack: data.componentStack,
      errorInfo: data.errorInfo
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

  // 追踪路由变化（公共方法）
  public trackRouteChange(from?: string, to?: string, data?: any) {
    this.trackBehavior('route-change', {
      from: from || document.referrer,
      to: to || window.location.pathname,
      path: window.location.pathname,
      search: window.location.search,
      ...data
    });
  }
}

// 单例
const monitor = new ReactMonitor();

export default monitor;

// React Error Boundary 组件
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 上报错误
    monitor.reportError({
      type: 'react-error-boundary',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      componentStack: errorInfo.componentStack,
      errorInfo: errorInfo.toString()
    });

    // 调用自定义错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.state.errorInfo!);
        }
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {this.state.error.toString()}
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC: 包装组件以自动捕获错误
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode)
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

