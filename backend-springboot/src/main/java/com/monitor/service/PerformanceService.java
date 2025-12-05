package com.monitor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 性能服务
 */
@Service
@RequiredArgsConstructor
public class PerformanceService {
    
    private final InfluxDBService influxDBService;
    private final CacheService cacheService;
    
    /**
     * 上报性能数据
     */
    public void report(String projectId, String url, String userId, String sessionId,
                      Long loadTime, Long domReady, Long fcp, Long lcp, Long fid,
                      Double cls, Long dns, Long tcp, Long ttfb) {
        influxDBService.writePerformance(projectId, url, userId, sessionId,
            loadTime, domReady, fcp, lcp, fid, cls, dns, tcp, ttfb);
        
        // 清除统计缓存
        cacheService.delete("performance:stats:" + projectId);
        cacheService.delete("dashboard:" + projectId);
    }
    
    /**
     * 获取性能统计
     */
    public Map<String, Object> getStats(String projectId) {
        // 尝试从缓存获取
        Map<String, Object> cached = cacheService.get("performance:stats:" + projectId, Map.class);
        if (cached != null) {
            return cached;
        }
        
        // TODO: 从 InfluxDB 查询统计数据
        Map<String, Object> stats = new HashMap<>();
        stats.put("avgLoadTime", 0L);
        stats.put("avgFCP", 0L);
        stats.put("avgLCP", 0L);
        stats.put("avgFID", 0L);
        stats.put("avgCLS", "0.0000");
        stats.put("timeStats", new HashMap<>());
        
        // 缓存结果
        cacheService.set("performance:stats:" + projectId, stats, 60L);
        
        return stats;
    }
}

