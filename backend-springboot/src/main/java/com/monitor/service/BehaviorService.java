package com.monitor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户行为服务
 */
@Service
@RequiredArgsConstructor
public class BehaviorService {
    
    private final InfluxDBService influxDBService;
    private final CacheService cacheService;
    
    /**
     * 上报用户行为
     */
    public void report(String projectId, String type, String url, String path,
                      String userId, String sessionId) {
        influxDBService.writeBehavior(projectId, type, url, path, userId, sessionId);
        
        // 如果是 PV，更新实时计数
        if ("pv".equals(type)) {
            cacheService.incrTodayPV(projectId);
            if (sessionId != null && !sessionId.isEmpty()) {
                cacheService.addTodayUV(projectId, sessionId);
            }
        }
        
        // 清除统计缓存
        cacheService.delete("behavior:stats:" + projectId);
        cacheService.delete("dashboard:" + projectId);
    }
    
    /**
     * 获取行为统计
     */
    public Map<String, Object> getStats(String projectId) {
        return getStats(projectId, null);
    }
    
    /**
     * 获取行为统计（支持类型过滤）
     */
    public Map<String, Object> getStats(String projectId, String type) {
        // 如果指定了类型，不使用缓存
        String cacheKey = "behavior:stats:" + projectId + (type != null ? ":" + type : "");
        if (type == null) {
            Map<String, Object> cached = cacheService.get(cacheKey, Map.class);
            if (cached != null) {
                return cached;
            }
        }
        
        // TODO: 从 InfluxDB 查询统计数据
        // 这里简化处理，实际应该查询 InfluxDB
        
        Map<String, Object> stats = new HashMap<>();
        if (type == null || "pv".equals(type)) {
            stats.put("pv", cacheService.getTodayPV(projectId));
            stats.put("uv", cacheService.getTodayUV(projectId));
        }
        stats.put("type", type != null ? type : "pv");
        stats.put("total", type == null || "pv".equals(type) ? cacheService.getTodayPV(projectId) : 0L);
        stats.put("timeStats", new HashMap<>());
        stats.put("topPages", new java.util.ArrayList<>());
        stats.put("topItems", new java.util.ArrayList<>());
        
        // 缓存结果（仅当没有指定类型时）
        if (type == null) {
            cacheService.set(cacheKey, stats, 60L);
        }
        
        return stats;
    }
}

