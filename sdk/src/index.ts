interface MonitorConfig {
  apiUrl: string
  projectId: string
  userId?: string
  enableError?: boolean
  enablePerformance?: boolean
  enableBehavior?: boolean
  enableApi?: boolean
  sampleRate?: number
}

interface ErrorData {
  type: string
  message: string
  stack?: string
  url: string
  line?: number
  col?: number
  timestamp: string
  userAgent: string
  userId?: string
  sessionId: string
  projectId: string
}

interface PerformanceData {
  loadTime: number
  fcp?: number
  lcp?: number
  fid?: number
  cls?: number
  url: string
  timestamp: string
  userAgent: string
  userId?: string
  sessionId: string
  projectId: string
}

interface BehaviorData {
  type: string
  url: string
  path?: string
  timestamp: string
  userId?: string
  sessionId: string
  projectId: string
  data?: any
}

interface ApiData {
  url: string
  method: string
  status: number
  responseTime: number
  timestamp: string
  userId?: string
  sessionId: string
  projectId: string
  requestData?: any
  responseData?: any
}

// 检测运行环境
function isMiniProgram(): boolean {
  if (typeof wx !== 'undefined' && wx.getSystemInfo) {
    return true
  }
  return false
}

class Monitor {
  private config: MonitorConfig
  private sessionId: string
  private queue: any[] = []
  private isSending = false
  private initialized = false

  constructor(config: MonitorConfig) {
    // 验证必需参数
    if (!config.projectId || !config.projectId.trim()) {
      console.error('Monitor SDK: projectId 是必需的，请在管理端创建项目后获取项目ID')
      this.initialized = false
      // 设置默认值避免类型错误
      this.config = config as MonitorConfig
      this.sessionId = ''
      return
    }
    
    if (!config.apiUrl || !config.apiUrl.trim()) {
      console.error('Monitor SDK: apiUrl 是必需的')
      this.initialized = false
      this.config = config as MonitorConfig
      this.sessionId = ''
      return
    }
    
    this.config = {
      enableError: true,
      enablePerformance: true,
      enableBehavior: true,
      enableApi: true,
      sampleRate: 1,
      ...config
    }
    
    this.sessionId = this.generateSessionId()
    this.initialized = true
    
    // 检测环境，如果是小程序环境，提示使用小程序版本
    if (isMiniProgram()) {
      console.warn('检测到微信小程序环境，请使用 miniprogram.ts 版本')
      return
    }
    
    this.init()
  }

  private generateSessionId(): string {
    // 尝试从 localStorage 获取已存在的 sessionId
    const storageKey = 'monitor_session_id'
    if (typeof window !== 'undefined' && window.localStorage) {
      const existingSessionId = localStorage.getItem(storageKey)
      if (existingSessionId) {
        return existingSessionId
      }
    }
    
    // 生成新的 sessionId 并保存
    const newSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(storageKey, newSessionId)
    }
    return newSessionId
  }

  // 解码 URL 中的中文字符
  private decodeUrl(url: string): string {
    try {
      return decodeURIComponent(url)
    } catch (e) {
      return url
    }
  }

  private init() {
    if (!this.initialized) return
    
    if (this.config.enableError) {
      this.initErrorMonitor()
    }
    
    if (this.config.enablePerformance) {
      this.initPerformanceMonitor()
    }
    
    if (this.config.enableBehavior) {
      this.initBehaviorMonitor()
    }
    
    if (this.config.enableApi) {
      this.initApiMonitor()
    }
  }

  // 错误监控
  private initErrorMonitor() {
    if (!this.initialized) return
    
    // 统一的错误监听器，先判断是否是资源错误
    window.addEventListener('error', (event) => {
      if (!this.initialized || Math.random() > (this.config.sampleRate || 1)) return
      
      // 先检查是否是资源加载错误
      if (event.target && (event.target as HTMLElement).tagName) {
        const target = event.target as HTMLElement
        if (['IMG', 'SCRIPT', 'LINK', 'VIDEO', 'AUDIO'].includes(target.tagName)) {
          // 资源加载错误
          const resourceUrl = (target as HTMLImageElement).src || 
                             (target as HTMLLinkElement).href || 
                             (target as HTMLScriptElement).src || 
                             (target as HTMLVideoElement).src || 
                             (target as HTMLAudioElement).src || ''
          
          // 关键修复：过滤 SDK 自身的上报请求，避免死循环
          if (this.isMonitorRequest(resourceUrl)) {
            return // SDK 自身的请求失败，不进行错误上报，避免循环
          }
          
          const errorData: ErrorData = {
            type: 'resource',
            message: `资源加载失败: ${resourceUrl}`,
            url: this.decodeUrl(window.location.href),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            userId: this.config.userId,
            sessionId: this.sessionId,
            projectId: this.config.projectId
          }
          
          this.reportError(errorData)
          return // 资源错误已处理，不再处理为 JS 错误
        }
      }
      
      // JavaScript 运行时错误
      if (event.error) {
        const errorData: ErrorData = {
          type: 'js',
          message: event.message,
          stack: event.error?.stack,
          url: this.decodeUrl(event.filename || window.location.href),
          line: event.lineno,
          col: event.colno,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          userId: this.config.userId,
          sessionId: this.sessionId,
          projectId: this.config.projectId
        }
        
        this.reportError(errorData)
      }
    }, true)

    // Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
      if (Math.random() > (this.config.sampleRate || 1)) return
      
      const errorData: ErrorData = {
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        url: this.decodeUrl(window.location.href),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userId: this.config.userId,
        sessionId: this.sessionId,
        projectId: this.config.projectId
      }
      
      this.reportError(errorData)
    })
  }

  // 性能监控
  private initPerformanceMonitor() {
    if (document.readyState === 'complete') {
      this.collectPerformance()
    } else {
      window.addEventListener('load', () => {
        this.collectPerformance()
      })
    }
  }

  private collectPerformance() {
    if (Math.random() > (this.config.sampleRate || 1)) return

    const timing = performance.timing
    // 确保 loadEventEnd 已经准备好，否则延迟收集
    if (timing.loadEventEnd === 0) {
      setTimeout(() => this.collectPerformance(), 100)
      return
    }
    const loadTime = timing.loadEventEnd - timing.navigationStart
    // 过滤无效数据
    if (loadTime <= 0 || loadTime > 60000) return

    const performanceData: PerformanceData = {
      loadTime,
      url: this.decodeUrl(window.location.href),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId
    }

    // Web Vitals
    if ('PerformanceObserver' in window) {
      // FCP
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find((entry: any) => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            performanceData.fcp = Math.round(fcpEntry.startTime)
          }
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
      } catch (e) {}

      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            performanceData.lcp = Math.round(lastEntry.startTime)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {}

      // FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fidEntry = entries[0] as any
          if (fidEntry) {
            performanceData.fid = Math.round(fidEntry.processingStart - fidEntry.startTime)
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {}
    }

    // CLS
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        performanceData.cls = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {}

    // 延迟上报性能数据（等待 Web Vitals 收集）
    setTimeout(() => {
      this.reportPerformance(performanceData)
    }, 3000)
  }

  // 用户行为监控
  private initBehaviorMonitor() {
    // PV 统计
    this.trackBehavior('pv', {
      url: this.decodeUrl(window.location.href),
      path: this.decodeUrl(window.location.pathname)
    })

    // 路由变化（SPA）
    this.trackRouteChange()

    // 点击事件
    document.addEventListener('click', (event) => {
      if (Math.random() > (this.config.sampleRate || 1)) return
      
      const target = event.target as HTMLElement
      const rect = target.getBoundingClientRect()
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
      })
    }, true)
  }

  private trackRouteChange() {
    // 监听 pushState 和 replaceState
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      window.dispatchEvent(new Event('popstate'))
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      window.dispatchEvent(new Event('popstate'))
    }

    window.addEventListener('popstate', () => {
      this.trackBehavior('pv', {
        url: this.decodeUrl(window.location.href),
        path: this.decodeUrl(window.location.pathname)
      })
    })
  }

  // 检查是否是监控 SDK 自身的请求或开发工具请求
  private isMonitorRequest(url: string): boolean {
    if (!url) return false
    // 过滤监控 SDK 自身的上报请求
    const apiUrl = this.config.apiUrl
    // 移除查询参数和 hash，只比较基础 URL
    const urlWithoutQuery = url.split('?')[0].split('#')[0]
    const apiUrlWithoutQuery = apiUrl.split('?')[0].split('#')[0]
    
    // 检查完整 URL 是否以 apiUrl 开头（更精确的匹配）
    if (urlWithoutQuery.startsWith(apiUrlWithoutQuery)) {
      // 进一步检查是否是监控接口（包括带查询参数的情况）
      if (url.includes('/error/report') || 
          url.includes('/performance/report') || 
          url.includes('/behavior/report') || 
          url.includes('/api/report')) {
        return true
      }
    }
    
    // 兼容性检查：即使 URL 不完全匹配，只要包含监控接口路径也认为是监控请求
    if (url.includes('/error/report') || 
        url.includes('/performance/report') || 
        url.includes('/behavior/report') || 
        url.includes('/api/report')) {
      return true
    }
    
    // 过滤开发工具和热更新请求
    // Vite HMR
    if (url.includes('.hot-update.') || 
        url.includes('/@vite/client') ||
        url.includes('/@react-refresh') ||
        url.includes('__vite_ping')) {
      return true
    }
    
    // Webpack HMR
    if (url.includes('__webpack_hmr') ||
        url.includes('webpack-dev-server') ||
        url.includes('sockjs-node')) {
      return true
    }
    
    // WebSocket 连接（HMR 通常使用 WebSocket）
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return true
    }
    
    // 浏览器扩展和开发工具
    if (url.startsWith('chrome-extension://') ||
        url.startsWith('moz-extension://') ||
        url.startsWith('safari-extension://') ||
        url.startsWith('edge-extension://')) {
      return true
    }
    
    return false
  }

  // 接口监控
  private initApiMonitor() {
    const originalFetch = window.fetch
    const self = this

    window.fetch = function(...args) {
      const startTime = Date.now()
      const url = typeof args[0] === 'string' ? args[0] : args[0].url
      const method = args[1]?.method || 'GET'

      // 跳过监控 SDK 自身的请求
      if (self.isMonitorRequest(url)) {
        return originalFetch.apply(this, args)
      }

      return originalFetch.apply(this, args)
        .then((response) => {
          const responseTime = Date.now() - startTime
          
          if (Math.random() <= (self.config.sampleRate || 1)) {
            self.reportApi({
              url,
              method,
              status: response.status,
              responseTime,
              timestamp: new Date().toISOString(),
              userId: self.config.userId,
              sessionId: self.sessionId,
              projectId: self.config.projectId
            })
          }
          
          return response
        })
        .catch((error) => {
          const responseTime = Date.now() - startTime
          
          if (Math.random() <= (self.config.sampleRate || 1)) {
            self.reportApi({
              url,
              method,
              status: 0,
              responseTime,
              timestamp: new Date().toISOString(),
              userId: self.config.userId,
              sessionId: self.sessionId,
              projectId: self.config.projectId
            })
          }
          
          throw error
        })
    }

    // XMLHttpRequest 监控
    const originalOpen = XMLHttpRequest.prototype.open
    const originalSend = XMLHttpRequest.prototype.send

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      this._monitorUrl = typeof url === 'string' ? url : url.toString()
      this._monitorMethod = method
      return originalOpen.apply(this, [method, url, ...args])
    }

    XMLHttpRequest.prototype.send = function(...args: any[]) {
      const startTime = Date.now()
      const url = this._monitorUrl
      const method = this._monitorMethod

      // 跳过监控 SDK 自身的请求
      if (self.isMonitorRequest(url)) {
        return originalSend.apply(this, args)
      }

      this.addEventListener('loadend', function() {
        const responseTime = Date.now() - startTime
        
        if (Math.random() <= (self.config.sampleRate || 1)) {
          self.reportApi({
            url,
            method,
            status: this.status,
            responseTime,
            timestamp: new Date().toISOString(),
            userId: self.config.userId,
            sessionId: self.sessionId,
            projectId: self.config.projectId
          })
        }
      })

      return originalSend.apply(this, args)
    }
  }

  // 上报方法
  private reportError(data: ErrorData) {
    this.send('/error/report', data)
  }

  private reportPerformance(data: PerformanceData) {
    this.send('/performance/report', data)
  }

  private trackBehavior(type: string, data?: any) {
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
        userAgent: navigator.userAgent,
        screenSize: {
          width: window.screen.width,
          height: window.screen.height
        },
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: document.referrer || ''
      }
    }
    
    this.send('/behavior/report', behaviorData)
  }

  private reportApi(data: ApiData) {
    this.send('/api/report', data)
  }

  private send(endpoint: string, data: any) {
    if (!this.initialized) {
      console.warn('Monitor SDK: SDK 未正确初始化，数据无法上报')
      return
    }
    this.queue.push({ endpoint, data })
    this.flush()
  }

  /**
   * 优先使用 sendBeacon 或 img 方式上报数据
   * @param endpoint 接口路径
   * @param data 数据对象
   * @returns 是否成功发送（true=已发送，false=需要使用 fetch）
   */
  private sendData(endpoint: string, data: any): boolean {
    const url = `${this.config.apiUrl}${endpoint}`
    const dataStr = JSON.stringify(data)
    
    // 方式1: 优先使用 navigator.sendBeacon (适合页面卸载场景，数据量较小)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon && dataStr.length < 65536) {
      try {
        const blob = new Blob([dataStr], { type: 'application/json' })
        if (navigator.sendBeacon(url, blob)) {
          return true
        }
      } catch (e) {
        // sendBeacon 失败，继续尝试其他方式
      }
    }
    
    // 方式2: 使用 img 方式 (GET 请求，兼容性最好，适合小数据量)
    // URL 长度限制通常为 2000 字符，为了安全设置为 1500
    if (dataStr.length < 1500) {
      try {
        const img = new Image()
        const encodedData = encodeURIComponent(dataStr)
        const fullUrl = `${url}?data=${encodedData}`
        
        // 关键修复：添加错误处理，避免触发资源错误监控
        img.onerror = () => {
          // 静默失败，不触发全局错误监听
          // 这是 SDK 自身的请求，失败不应该被当作资源错误上报
        }
        img.onload = () => {
          // 成功加载，清理
          setTimeout(() => {
            img.src = ''
          }, 100)
        }
        
        // 使用 GET 请求，数据放在 query 参数中
        img.src = fullUrl
        
        // 设置超时清理，避免图片加载失败时阻塞
        setTimeout(() => {
          img.src = ''
        }, 1000)
        return true
      } catch (e) {
        // img 方式失败，继续尝试 fetch
      }
    }
    
    // 返回 false 表示需要使用 fetch
    return false
  }

  private async flush() {
    if (this.isSending || this.queue.length === 0) return
    
    this.isSending = true
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()
      
      try {
        // 先尝试使用 sendBeacon 或 img
        const sent = this.sendData(item.endpoint, item.data)
        
        if (!sent) {
          // 如果前两种方式都不可用，使用 fetch
          await fetch(`${this.config.apiUrl}${item.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(item.data),
            keepalive: true
          })
        }
      } catch (error) {
        console.error('Monitor SDK: Failed to send data', error)
        // 失败的数据重新入队
        this.queue.unshift(item)
        break
      }
    }
    
    this.isSending = false
  }

  // 手动上报错误
  public captureError(error: Error, context?: any) {
    const errorData: ErrorData = {
      type: 'js',
      message: error.message,
      stack: error.stack,
      url: this.decodeUrl(window.location.href),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId,
      ...context
    }
    
    this.reportError(errorData)
  }

  // 手动追踪行为
  public track(event: string, data?: any) {
    // 自定义事件使用 'custom' 类型，但保留原始事件名在data中
    this.trackBehavior('custom', {
      eventName: event,
      ...data
    })
  }
}

// 导出
declare global {
  interface Window {
    Monitor: typeof Monitor
  }
}

export default Monitor

// 自动初始化（如果配置了）
if (typeof window !== 'undefined') {
  window.Monitor = Monitor
}
