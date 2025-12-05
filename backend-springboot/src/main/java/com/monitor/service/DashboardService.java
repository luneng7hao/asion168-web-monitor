package com.monitor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Dashboard 服务
 */
@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final ErrorService errorService;
    private final PerformanceService performanceService;
    private final BehaviorService behaviorService;
    private final ApiMonitorService apiMonitorService;
    private final CacheService cacheService;
    
    /**
     * 获取 Dashboard 概览数据
     */
    public Map<String, Object> getOverview(String projectId) {
        // 尝试从缓存获取
        Map<String, Object> cached = cacheService.getDashboard(projectId, Map.class);
        if (cached != null) {
            return cached;
        }
        
        try {
            // 并行获取各模块数据
            Map<String, Object> errorStats = errorService.getStats(projectId);
            Map<String, Object> performanceStats = performanceService.getStats(projectId);
            Map<String, Object> behaviorStats = behaviorService.getStats(projectId);
            Map<String, Object> apiStats = apiMonitorService.getStats(projectId);
            
            Long todayErrorCount = cacheService.getTodayErrorCount(projectId);
            Long todayPV = cacheService.getTodayPV(projectId);
            Long todayUV = cacheService.getTodayUV(projectId);
            
            Map<String, Object> overview = new HashMap<>();
            
            // 错误统计
            Map<String, Object> errors = new HashMap<>();
            errors.put("today", todayErrorCount);
            errors.put("yesterday", 0L); // TODO: 从时间趋势获取
            errors.put("last7Days", errorStats.getOrDefault("total", 0L));
            errors.put("trend", 0.0);
            overview.put("errors", errors);
            
            // 性能统计
            Map<String, Object> performance = new HashMap<>();
            performance.put("avgLoadTime", performanceStats.getOrDefault("avgLoadTime", 0L));
            performance.put("avgFCP", performanceStats.getOrDefault("avgFCP", 0L));
            performance.put("avgLCP", performanceStats.getOrDefault("avgLCP", 0L));
            overview.put("performance", performance);
            
            // 行为统计
            Map<String, Object> behavior = new HashMap<>();
            behavior.put("todayPV", todayPV);
            behavior.put("todayUV", todayUV);
            behavior.put("totalPV", behaviorStats.getOrDefault("pv", 0L));
            behavior.put("totalUV", behaviorStats.getOrDefault("uv", 0L));
            overview.put("behavior", behavior);
            
            // API 统计
            Map<String, Object> api = new HashMap<>();
            api.put("successRate", apiStats.getOrDefault("successRate", 100.0));
            api.put("total", apiStats.getOrDefault("total", 0L));
            api.put("avgResponseTime", apiStats.getOrDefault("avgResponseTime", 0L));
            overview.put("api", api);
            
            // 缓存结果
            cacheService.setDashboard(projectId, overview, 30L);
            
            return overview;
        } catch (Exception e) {
            System.err.println("Dashboard overview failed: " + e.getMessage());
            Map<String, Object> overview = new HashMap<>();
            overview.put("errors", Map.of("today", 0L, "yesterday", 0L, "last7Days", 0L, "trend", 0.0));
            overview.put("performance", Map.of("avgLoadTime", 0L, "avgFCP", 0L, "avgLCP", 0L));
            overview.put("behavior", Map.of("todayPV", 0L, "todayUV", 0L, "totalPV", 0L, "totalUV", 0L));
            overview.put("api", Map.of("successRate", 100.0, "total", 0L, "avgResponseTime", 0L));
            return overview;
        }
    }
}

