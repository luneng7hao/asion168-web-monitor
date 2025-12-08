/**
 * 前端监控 SDK - 浏览器版本
 * 适用于 JSP、HTML 等传统多页面应用
 * 
 * 使用方法：
 * <script src="monitor-sdk.js"></script>
 * <script>
 *   var monitor = new Monitor({
 *     apiUrl: 'http://localhost:3000/api',
 *     projectId: 'your-project-id'
 *   });
 * </script>
 */

(function(global) {
  'use strict';

  function Monitor(config) {
    // 验证必需参数
    if (!config || !config.projectId || !config.projectId.trim()) {
      console.error('Monitor SDK: projectId 是必需的，请在管理端创建项目后获取项目ID');
      return;
    }
    
    if (!config.apiUrl || !config.apiUrl.trim()) {
      console.error('Monitor SDK: apiUrl 是必需的');
      return;
    }

    this.config = {
      apiUrl: config.apiUrl,
      projectId: config.projectId,
      userId: config.userId || '',
      enableError: config.enableError !== false,
      enablePerformance: config.enablePerformance !== false,
      enableBehavior: config.enableBehavior !== false,
      enableApi: config.enableApi !== false,
      sampleRate: config.sampleRate || 1
    };

    this.sessionId = this._generateSessionId();
    this.queue = [];
    this.isSending = false;
    this.initialized = true;

    this._init();
  }

  Monitor.prototype._generateSessionId = function() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  Monitor.prototype._init = function() {
    if (this.config.enableError) {
      this._initErrorMonitor();
    }
    if (this.config.enablePerformance) {
      this._initPerformanceMonitor();
    }
    if (this.config.enableBehavior) {
      this._initBehaviorMonitor();
    }
    if (this.config.enableApi) {
      this._initApiMonitor();
    }
  };

  // 错误监控
  Monitor.prototype._initErrorMonitor = function() {
    var self = this;

    // JavaScript 错误
    window.addEventListener('error', function(event) {
      if (Math.random() > self.config.sampleRate) return;

      // 判断是否为资源加载错误
      if (event.target && event.target.tagName) {
        var tagName = event.target.tagName.toUpperCase();
        if (['IMG', 'SCRIPT', 'LINK', 'VIDEO', 'AUDIO'].indexOf(tagName) !== -1) {
          self._reportError({
            type: 'resource',
            message: '资源加载失败: ' + (event.target.src || event.target.href || ''),
            url: window.location.href
          });
          return;
        }
      }

      self._reportError({
        type: 'js',
        message: event.message,
        stack: event.error ? event.error.stack : '',
        url: event.filename || window.location.href,
        line: event.lineno,
        col: event.colno
      });
    }, true);

    // Promise 错误
    window.addEventListener('unhandledrejection', function(event) {
      if (Math.random() > self.config.sampleRate) return;

      var message = '';
      var stack = '';
      if (event.reason) {
        message = event.reason.message || String(event.reason);
        stack = event.reason.stack || '';
      }

      self._reportError({
        type: 'promise',
        message: message,
        stack: stack,
        url: window.location.href
      });
    });
  };

  // 性能监控
  Monitor.prototype._initPerformanceMonitor = function() {
    var self = this;

    function collectPerformance() {
      if (Math.random() > self.config.sampleRate) return;

      var timing = performance.timing;
      var loadTime = timing.loadEventEnd - timing.navigationStart;

      // 等待 loadEventEnd 有值
      if (loadTime <= 0) {
        setTimeout(collectPerformance, 100);
        return;
      }

      var data = {
        loadTime: loadTime,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.requestStart,
        domParse: timing.domInteractive - timing.responseEnd,
        url: window.location.href
      };

      // Web Vitals (如果支持)
      if (window.PerformanceObserver) {
        try {
          // FCP
          var fcpObserver = new PerformanceObserver(function(list) {
            var entries = list.getEntries();
            for (var i = 0; i < entries.length; i++) {
              if (entries[i].name === 'first-contentful-paint') {
                data.fcp = Math.round(entries[i].startTime);
              }
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {}

        try {
          // LCP
          var lcpObserver = new PerformanceObserver(function(list) {
            var entries = list.getEntries();
            if (entries.length > 0) {
              data.lcp = Math.round(entries[entries.length - 1].startTime);
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {}
      }

      // 延迟上报，等待 Web Vitals 收集
      setTimeout(function() {
        self._send('/performance/report', data);
      }, 3000);
    }

    if (document.readyState === 'complete') {
      collectPerformance();
    } else {
      window.addEventListener('load', collectPerformance);
    }
  };

  // 用户行为监控
  Monitor.prototype._initBehaviorMonitor = function() {
    var self = this;

    // PV 统计
    this._trackBehavior('pv', {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title
    });

    // 点击事件
    document.addEventListener('click', function(event) {
      if (Math.random() > self.config.sampleRate) return;

      var target = event.target;
      var tagName = target.tagName || '';
      var text = (target.textContent || target.innerText || '').substring(0, 50);
      var id = target.id || '';
      var className = target.className || '';

      self._trackBehavior('click', {
        url: window.location.href,
        element: tagName,
        text: text,
        id: id,
        className: typeof className === 'string' ? className : ''
      });
    }, true);
  };

  // 接口监控
  Monitor.prototype._initApiMonitor = function() {
    var self = this;

    // 拦截 XMLHttpRequest
    var originalOpen = XMLHttpRequest.prototype.open;
    var originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
      this._monitorUrl = url;
      this._monitorMethod = method;
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
      var xhr = this;
      var startTime = Date.now();
      var url = xhr._monitorUrl;
      var method = xhr._monitorMethod;

      xhr.addEventListener('loadend', function() {
        var responseTime = Date.now() - startTime;

        if (Math.random() <= self.config.sampleRate) {
          self._send('/api/report', {
            url: url,
            method: method,
            status: xhr.status,
            responseTime: responseTime
          });
        }
      });

      return originalSend.apply(this, arguments);
    };

    // 拦截 fetch (如果支持)
    if (window.fetch) {
      var originalFetch = window.fetch;

      window.fetch = function(input, init) {
        var startTime = Date.now();
        var url = typeof input === 'string' ? input : input.url;
        var method = (init && init.method) || 'GET';

        return originalFetch.apply(this, arguments)
          .then(function(response) {
            var responseTime = Date.now() - startTime;

            if (Math.random() <= self.config.sampleRate) {
              self._send('/api/report', {
                url: url,
                method: method,
                status: response.status,
                responseTime: responseTime
              });
            }

            return response;
          })
          .catch(function(error) {
            var responseTime = Date.now() - startTime;

            if (Math.random() <= self.config.sampleRate) {
              self._send('/api/report', {
                url: url,
                method: method,
                status: 0,
                responseTime: responseTime
              });
            }

            throw error;
          });
      };
    }
  };

  // 上报错误
  Monitor.prototype._reportError = function(errorData) {
    this._send('/error/report', {
      type: errorData.type,
      message: errorData.message,
      stack: errorData.stack || '',
      url: errorData.url,
      line: errorData.line,
      col: errorData.col
    });
  };

  // 追踪行为
  Monitor.prototype._trackBehavior = function(type, data) {
    this._send('/behavior/report', {
      type: type,
      url: window.location.href,
      path: window.location.pathname,
      data: data
    });
  };

  // 发送数据
  Monitor.prototype._send = function(endpoint, data) {
    if (!this.initialized) {
      console.warn('Monitor SDK: SDK 未正确初始化');
      return;
    }

    var payload = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      projectId: this.config.projectId
    };

    // 合并数据
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        payload[key] = data[key];
      }
    }

    this.queue.push({ endpoint: endpoint, data: payload });
    this._flush();
  };

  // 批量发送
  Monitor.prototype._flush = function() {
    if (this.isSending || this.queue.length === 0) return;

    var self = this;
    this.isSending = true;

    function sendNext() {
      if (self.queue.length === 0) {
        self.isSending = false;
        return;
      }

      var item = self.queue.shift();
      var url = self.config.apiUrl + item.endpoint;

      // 使用 XMLHttpRequest 发送（兼容性更好）
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          sendNext();
        }
      };
      xhr.onerror = function() {
        // 失败时重新入队
        self.queue.unshift(item);
        self.isSending = false;
      };
      xhr.send(JSON.stringify(item.data));
    }

    sendNext();
  };

  // 手动上报错误
  Monitor.prototype.captureError = function(error, context) {
    var message = '';
    var stack = '';

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack || '';
    }

    var data = {
      type: 'js',
      message: message,
      stack: stack,
      url: window.location.href
    };

    if (context) {
      for (var key in context) {
        if (context.hasOwnProperty(key)) {
          data[key] = context[key];
        }
      }
    }

    this._reportError(data);
  };

  // 手动追踪事件
  Monitor.prototype.track = function(event, data) {
    this._trackBehavior(event, data);
  };

  // 设置用户ID
  Monitor.prototype.setUserId = function(userId) {
    this.config.userId = userId;
  };

  // 暴露到全局
  global.Monitor = Monitor;

})(typeof window !== 'undefined' ? window : this);

