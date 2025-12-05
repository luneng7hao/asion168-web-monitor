package com.monitor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 接口监控服务
 */
@Service
@RequiredArgsConstructor
public class ApiMonitorService {
    
    private final InfluxDBService influxDBService;
    private final CacheService cacheService;
    
    /**
     * 上报接口监控数据
     */
    public void report(String projectId, String url, String method, Integer status,
                      Long responseTime, String userId, String sessionId) {
        report(projectId, url, method, status, responseTime, userId, sessionId, null, null);
    }
    
    /**
     * 上报接口监控数据（包含请求和响应数据）
     */
    public void report(String projectId, String url, String method, Integer status,
                      Long responseTime, String userId, String sessionId,
                      Object requestData, Object responseData) {
        influxDBService.writeApiMonitor(projectId, url, method, status, responseTime, userId, sessionId);
        
        // 清除统计缓存
        cacheService.delete("api:stats:" + projectId);
        cacheService.delete("dashboard:" + projectId);
    }
    
    /**
     * 获取接口统计
     */
    public Map<String, Object> getStats(String projectId) {
        // 尝试从缓存获取
        Map<String, Object> cached = cacheService.get("api:stats:" + projectId, Map.class);
        if (cached != null) {
            return cached;
        }
        
        // TODO: 从 InfluxDB 查询统计数据
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", 0L);
        stats.put("success", 0L);
        stats.put("error", 0L);
        stats.put("successRate", 100.0);
        stats.put("avgResponseTime", 0L);
        stats.put("timeStats", new HashMap<>());
        stats.put("topApis", new java.util.ArrayList<>());
        
        // 缓存结果
        cacheService.set("api:stats:" + projectId, stats, 60L);
        
        return stats;
    }
}

