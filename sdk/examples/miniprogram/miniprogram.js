"use strict";
/**
 * 微信小程序监控 SDK
 * 适配微信小程序环境
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](e)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class MiniProgramMonitor {
    constructor(config) {
        this.queue = [];
        this.isSending = false;
        this.systemInfo = null;
        this.originalRequest = null;
        this.pageStartTime = 0;
        this.initialized = false;
        // 如果传入了配置，则初始化
        if (config) {
            this.init(config);
        }
        else {
            // 未传入配置，创建未初始化的实例
            this.initialized = false;
            this.config = {};
            this.sessionId = '';
        }
    }
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    initSystemInfo() {
        try {
            wx.getSystemInfo({
                success: (res) => {
                    this.systemInfo = res;
                }
            });
        }
        catch (e) {
            console.error('获取系统信息失败:', e);
        }
    }
    setupMonitors() {
        if (!this.initialized)
            return;
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
    // 错误监控
    initErrorMonitor() {
        // 全局错误监听
        wx.onError((error) => {
            if (Math.random() > (this.config.sampleRate || 1))
                return;
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            const url = currentPage ? currentPage.route : 'unknown';
            const errorData = {
                type: 'js',
                message: error,
                url: `/${url}`,
                timestamp: new Date().toISOString(),
                systemInfo: this.systemInfo,
                userId: this.config.userId,
                sessionId: this.sessionId,
                projectId: this.config.projectId
            };
            this.reportError(errorData);
        });
        // Promise 未捕获错误
        wx.onUnhandledRejection((res) => {
            var _a, _b;
            if (Math.random() > (this.config.sampleRate || 1))
                return;
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            const url = currentPage ? currentPage.route : 'unknown';
            const errorData = {
                type: 'promise',
                message: ((_a = res.reason) === null || _a === void 0 ? void 0 : _a.message) || String(res.reason || res),
                stack: (_b = res.reason) === null || _b === void 0 ? void 0 : _b.stack,
                url: `/${url}`,
                timestamp: new Date().toISOString(),
                systemInfo: this.systemInfo,
                userId: this.config.userId,
                sessionId: this.sessionId,
                projectId: this.config.projectId
            };
            this.reportError(errorData);
        });
    }
    // 性能监控
    initPerformanceMonitor() {
        // 监听页面加载性能
        // 需要在各个 Page 的 onLoad 中调用
    }
    // 用户行为监控
    initBehaviorMonitor() {
        // 页面访问统计
        // 需要在 App 和 Page 生命周期中调用
    }
    // 检查是否是监控 SDK 自身的请求
    isMonitorRequest(url) {
        if (!url || !this.config || !this.config.apiUrl)
            return false;
        // 过滤监控 SDK 自身的上报请求
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
        // 这可以处理 URL 拼接错误的情况（如 /api/api/report）
        if (url.includes('/error/report') ||
            url.includes('/performance/report') ||
            url.includes('/behavior/report') ||
            url.includes('/api/report')) {
            // 进一步确认是监控相关的 URL（避免误判）
            if (url.includes(apiUrlWithoutQuery) || url.includes('/api/')) {
                return true;
            }
        }
        return false;
    }
    // 接口监控
    initApiMonitor() {
        // 拦截 wx.request
        this.originalRequest = wx.request;
        const self = this;
        wx.request = function (options) {
            const startTime = Date.now();
            const url = options.url || '';
            const method = (options.method || 'GET').toUpperCase();
            // 跳过监控 SDK 自身的请求
            if (self.isMonitorRequest(url)) {
                return self.originalRequest.call(wx, options);
            }
            // 添加成功回调
            const originalSuccess = options.success;
            options.success = function (res) {
                const responseTime = Date.now() - startTime;
                if (Math.random() <= (self.config.sampleRate || 1)) {
                    self.reportApi({
                        url,
                        method,
                        status: res.statusCode || 200,
                        responseTime,
                        timestamp: new Date().toISOString(),
                        userId: self.config.userId,
                        sessionId: self.sessionId,
                        projectId: self.config.projectId,
                        requestData: options.data,
                        responseData: res.data
                    });
                }
                if (originalSuccess) {
                    originalSuccess(res);
                }
            };
            // 添加失败回调
            const originalFail = options.fail;
            options.fail = function (err) {
                const responseTime = Date.now() - startTime;
                if (Math.random() <= (self.config.sampleRate || 1)) {
                    self.reportApi({
                        url,
                        method,
                        status: 0,
                        responseTime,
                        timestamp: new Date().toISOString(),
                        userId: self.config.userId,
                        sessionId: self.sessionId,
                        projectId: self.config.projectId,
                        requestData: options.data
                    });
                }
                if (originalFail) {
                    originalFail(err);
                }
            };
            return self.originalRequest.call(wx, options);
        };
    }
    // 上报方法
    reportError(data) {
        this.send('/error/report', data);
    }
    reportPerformance(data) {
        this.send('/performance/report', data);
    }
    trackBehavior(type, data) {
        if (!this.initialized || !this.config || !this.config.projectId) {
            console.warn('MiniProgramMonitor SDK: SDK 未正确初始化，行为追踪已跳过');
            return;
        }
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const url = currentPage ? currentPage.route : 'unknown';
        const behaviorData = {
            type,
            url: `/${url}`,
            path: `/${url}`,
            timestamp: new Date().toISOString(),
            userId: this.config.userId,
            sessionId: this.sessionId,
            projectId: this.config.projectId,
            data
        };
        this.send('/behavior/report', behaviorData);
    }
    reportApi(data) {
        this.send('/api/report', data);
    }
    send(endpoint, data) {
        if (!this.initialized) {
            console.warn('MiniProgramMonitor SDK: SDK 未正确初始化，数据无法上报');
            return;
        }
        if (!this.config || !this.config.apiUrl) {
            console.warn('MiniProgramMonitor SDK: 配置不完整，无法上报数据');
            return;
        }
        console.log('MiniProgramMonitor SDK: 准备上报数据', { endpoint, dataType: data.type || 'unknown' });
        this.queue.push({ endpoint, data });
        this.flush();
    }
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isSending || this.queue.length === 0)
                return;
            this.isSending = true;
            const self = this;
            while (this.queue.length > 0) {
                const item = this.queue.shift();
                try {
                    // 构建完整 URL
                    const fullUrl = `${self.config.apiUrl}${item.endpoint}`;
                    console.log('MiniProgramMonitor SDK: 发送数据', { url: fullUrl, endpoint: item.endpoint });
                    // 直接使用原始 request，避免被拦截导致无限循环
                    // 因为 flush 中的请求都是 SDK 自身的上报请求
                    yield new Promise((resolve, reject) => {
                        // 使用原始 request，不会被拦截
                        const requestMethod = self.originalRequest || wx.request;
                        if (!requestMethod) {
                            console.error('MiniProgramMonitor SDK: wx.request 不可用');
                            reject(new Error('wx.request 不可用'));
                            return;
                        }
                        requestMethod.call(wx, {
                            url: fullUrl,
                            method: 'POST',
                            header: {
                                'Content-Type': 'application/json'
                            },
                            data: item.data,
                            success: (res) => {
                                console.log('MiniProgramMonitor SDK: 数据上报成功', { url: fullUrl, status: res.statusCode });
                                resolve();
                            },
                            fail: (err) => {
                                console.error('MiniProgramMonitor SDK: 数据上报失败', { url: fullUrl, error: err });
                                reject(err);
                            }
                        });
                    });
                }
                catch (error) {
                    console.error('Monitor SDK: Failed to send data', error);
                    // 失败的数据重新入队
                    this.queue.unshift(item);
                    break;
                }
            }
            this.isSending = false;
        });
    }
    // 页面加载开始（在 Page onLoad 中调用）
    pageLoadStart() {
        this.pageStartTime = Date.now();
        this.trackBehavior('pv');
    }
    // 页面加载完成（在 Page onReady 中调用）
    pageLoadEnd() {
        if (this.pageStartTime > 0 && this.config.enablePerformance) {
            const loadTime = Date.now() - this.pageStartTime;
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            const url = currentPage ? currentPage.route : 'unknown';
            const performanceData = {
                loadTime,
                url: `/${url}`,
                timestamp: new Date().toISOString(),
                systemInfo: this.systemInfo,
                userId: this.config.userId,
                sessionId: this.sessionId,
                projectId: this.config.projectId
            };
            this.reportPerformance(performanceData);
            this.pageStartTime = 0;
        }
    }
    // 手动上报错误
    captureError(error, context) {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const url = currentPage ? currentPage.route : 'unknown';
        const errorData = Object.assign({ type: 'js', message: typeof error === 'string' ? error : error.message, stack: typeof error === 'object' ? error.stack : undefined, url: `/${url}`, timestamp: new Date().toISOString(), systemInfo: this.systemInfo, userId: this.config.userId, sessionId: this.sessionId, projectId: this.config.projectId }, context);
        this.reportError(errorData);
    }
    // 手动追踪行为
    track(event, data) {
        this.trackBehavior(event, data);
    }
    // 公共 init 方法，用于延迟初始化
    init(config) {
        if (this.initialized) {
            console.warn('MiniProgramMonitor: 已经初始化，将更新配置');
        }
        // 验证必需参数
        if (!config.projectId || !config.projectId.trim()) {
            console.error('MiniProgramMonitor SDK: projectId 是必需的，请在管理端创建项目后获取项目ID');
            return;
        }
        if (!config.apiUrl || !config.apiUrl.trim()) {
            console.error('MiniProgramMonitor SDK: apiUrl 是必需的');
            return;
        }
        this.config = Object.assign({ enableError: true, enablePerformance: true, enableBehavior: true, enableApi: true, sampleRate: 1 }, config);
        this.sessionId = this.generateSessionId();
        this.initialized = true;
        // 确保 originalRequest 被初始化（即使 enableApi 为 false，也要保存原始方法）
        this.originalRequest = wx.request;
        console.log('MiniProgramMonitor SDK: 初始化成功', {
            projectId: this.config.projectId,
            apiUrl: this.config.apiUrl,
            sessionId: this.sessionId,
            enableError: this.config.enableError,
            enablePerformance: this.config.enablePerformance,
            enableBehavior: this.config.enableBehavior,
            enableApi: this.config.enableApi
        });
        this.initSystemInfo();
        this.setupMonitors();
    }
}
// 创建单例实例（未初始化，需要调用 init 方法）
const monitor = new MiniProgramMonitor();
// 同时支持 ES6 模块和 CommonJS
exports.default = monitor;
module.exports = monitor;
module.exports.default = monitor;
