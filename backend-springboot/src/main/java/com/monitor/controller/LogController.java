package com.monitor.controller;

import com.monitor.service.ElasticsearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 监控日志控制器
 */
@RestController
@RequestMapping("/log")
@RequiredArgsConstructor
public class LogController {
    
    private final ElasticsearchService elasticsearchService;
    
    @Value("${default-project-id:001}")
    private String defaultProjectId;
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {
        
        // 如果没有指定时间范围，默认查询最近7天，截止到当前时间
        String finalStartTime = startTime;
        String finalEndTime = endTime;
        
        if (finalStartTime == null && finalEndTime == null) {
            Instant now = Instant.now();
            finalEndTime = now.toString();
            finalStartTime = now.minusSeconds(7 * 24 * 60 * 60).toString();
        }
        
        // 确保时间格式正确（ISO格式）
        if (finalStartTime != null && !finalStartTime.contains("T")) {
            finalStartTime = Instant.parse(finalStartTime).toString();
        }
        if (finalEndTime != null && !finalEndTime.contains("T")) {
            finalEndTime = Instant.parse(finalEndTime).toString();
        }
        
        // 调试日志
        System.out.println("🔍 Log search params: " + Map.of(
            "projectId", defaultProjectId,
            "userId", userId != null ? userId : "",
            "type", type != null ? type : "",
            "keyword", keyword != null ? keyword : "",
            "startTime", finalStartTime != null ? finalStartTime : "",
            "endTime", finalEndTime != null ? finalEndTime : "",
            "page", page,
            "pageSize", pageSize,
            "isConnected", elasticsearchService.isConnected()
        ));
        
        Map<String, Object> params = new HashMap<>();
        params.put("projectId", defaultProjectId);
        params.put("userId", userId);
        params.put("type", type);
        params.put("keyword", keyword);
        params.put("startTime", finalStartTime);
        params.put("endTime", finalEndTime);
        params.put("page", page);
        params.put("pageSize", pageSize);
        
        Map<String, Object> result = elasticsearchService.searchLogs(params);
        
        System.out.println("📊 Log search result: " + Map.of(
            "total", result.get("total"),
            "hitsCount", ((List<?>) result.get("hits")).size(),
            "isConnected", elasticsearchService.isConnected()
        ));
        
        // 如果未连接，返回提示信息
        if (!elasticsearchService.isConnected()) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Elasticsearch 未连接，请检查 Elasticsearch 服务是否运行",
                "data", Map.of(
                    "list", List.of(),
                    "total", 0,
                    "page", page,
                    "pageSize", pageSize
                )
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "list", result.get("hits"),
                "total", result.get("total"),
                "page", result.get("page"),
                "pageSize", result.get("pageSize")
            )
        ));
    }
    
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testWrite(@RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> logData = new HashMap<>();
            logData.put("projectId", defaultProjectId);
            logData.put("type", body.getOrDefault("type", "error"));
            logData.put("userId", body.getOrDefault("userId", "test-user"));
            logData.put("sessionId", body.getOrDefault("sessionId", "test-session"));
            logData.put("url", body.getOrDefault("url", "http://test.com"));
            logData.put("timestamp", Instant.now().toString());
            logData.put("message", body.getOrDefault("message", "Test log message"));
            logData.putAll(body);
            
            elasticsearchService.writeLog(logData);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "测试日志已写入"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "写入失败: " + (e.getMessage() != null ? e.getMessage() : "未知错误")
            ));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        // TODO: 实现日志统计信息查询
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "indexExists", false,
                "documentCount", 0,
                "isConnected", elasticsearchService.isConnected(),
                "message", "功能待实现"
            )
        ));
    }
}

