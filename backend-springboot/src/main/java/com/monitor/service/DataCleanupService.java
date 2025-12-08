package com.monitor.service;

import com.monitor.repository.ErrorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * 数据清理服务
 */
@Service
@RequiredArgsConstructor
public class DataCleanupService {
    
    private final ErrorLogRepository errorLogRepository;
    private final InfluxDBService influxDBService;
    private final CacheService cacheService;
    private final ElasticsearchService elasticsearchService;
    private final MongoTemplate mongoTemplate;
    
    /**
     * 清除所有监控数据
     */
    public void clearAllData(String projectId) {
        // 1. 清除 MongoDB 中的错误数据
        Query query = new Query(Criteria.where("projectId").is(projectId));
        mongoTemplate.remove(query, "errorLog");
        
        // 2. 清除 InfluxDB 中的数据
        influxDBService.clearAllData(projectId);
        
        // 3. 清除 Redis 中的缓存和计数
        cacheService.clearAllCache(projectId);
        
        // 4. 清除 Elasticsearch 中的监控日志
        elasticsearchService.clearAllData(projectId);
    }
    
    /**
     * 删除超过指定天数的数据（默认30天）
     */
    public void deleteOldData(String projectId, int days) {
        System.out.println("🧹 Starting cleanup: deleting data older than " + days + " days for project: " + projectId);
        
        try {
            // 1. 删除 MongoDB 中超过指定天数的错误数据
            Date cutoffDate = Date.from(Instant.now().minus(days, ChronoUnit.DAYS));
            Query query = new Query(Criteria.where("projectId").is(projectId)
                .and("timestamp").lt(cutoffDate));
            mongoTemplate.remove(query, "errorLog");
            
            // 2. 删除 InfluxDB 中超过指定天数的数据
            influxDBService.deleteOldData(projectId, days);
            
            // 3. 删除 Elasticsearch 中超过指定天数的监控日志
            elasticsearchService.deleteOldData(projectId, days);
            
            // Redis 缓存会自动过期，不需要手动删除
            
            System.out.println("✅ Cleanup completed: deleted data older than " + days + " days");
        } catch (Exception e) {
            System.err.println("❌ Cleanup failed: " + (e.getMessage() != null ? e.getMessage() : "未知错误"));
        }
    }
}

