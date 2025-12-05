package com.monitor.controller;

import com.monitor.service.ApiMonitorService;
import com.monitor.service.ElasticsearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 接口监控控制器
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiMonitorController {
    
    private final ApiMonitorService apiMonitorService;
    private final ElasticsearchService elasticsearchService;
    
    @Value("${default-project-id:001}")
    private String defaultProjectId;
    
    @PostMapping("/report")
    public ResponseEntity<Map<String, Object>> report(@RequestBody Map<String, Object> body) {
        return handleReport(body);
    }
    
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> reportGet(@RequestParam String data) {
        try {
            String decoded = java.net.URLDecoder.decode(data, java.nio.charset.StandardCharsets.UTF_8);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> body = mapper.readValue(decoded, Map.class);
            return handleReport(body);
        } catch (Exception e) {
            System.err.println("API report GET failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", "数据解析失败"));
        }
    }
    
    private ResponseEntity<Map<String, Object>> handleReport(Map<String, Object> body) {
        try {
            // 调试日志：检查 userId 是否正确传递
            if (body.get("userId") != null) {
                System.out.println("API monitor report - userId: " + body.get("userId") + ", url: " + body.get("url"));
            }
            
            apiMonitorService.report(
                defaultProjectId,
                (String) body.getOrDefault("url", ""),
                (String) body.getOrDefault("method", "GET"),
                body.get("status") != null ? ((Number) body.get("status")).intValue() : null,
                body.get("responseTime") != null ? ((Number) body.get("responseTime")).longValue() : null,
                (String) body.get("userId"),
                (String) body.get("sessionId"),
                body.get("requestData"),
                body.get("responseData")
            );
            
            // 异步写入 Elasticsearch（不阻塞主流程）
            Map<String, Object> logData = new HashMap<>();
            logData.put("projectId", defaultProjectId);
            logData.put("type", "api");
            logData.put("userId", body.get("userId"));
            logData.put("sessionId", body.get("sessionId"));
            logData.put("url", body.getOrDefault("url", ""));
            logData.put("timestamp", body.getOrDefault("timestamp", new java.util.Date().toInstant().toString()));
            logData.put("method", body.getOrDefault("method", "GET"));
            logData.put("status", body.get("status"));
            logData.put("responseTime", body.get("responseTime"));
            logData.put("message", body.getOrDefault("method", "GET") + " " + body.getOrDefault("url", "") + " - " + body.getOrDefault("status", 0) + " (" + body.getOrDefault("responseTime", 0) + "ms)");
            logData.put("requestData", body.get("requestData"));
            logData.put("responseData", body.get("responseData"));
            
            try {
                elasticsearchService.writeLog(logData);
            } catch (Exception e) {
                System.out.println("⚠️ Elasticsearch write failed (non-blocking): " + e.getMessage());
            }
            
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            System.err.println("API monitor report failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", "上报失败"));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = apiMonitorService.getStats(defaultProjectId);
        return ResponseEntity.ok(Map.of("success", true, "data", stats));
    }
    
    @GetMapping("/errors")
    public ResponseEntity<Map<String, Object>> getErrorDetails(
            @RequestParam String url,
            @RequestParam(required = false, defaultValue = "GET") String method) {
        // TODO: 实现接口错误详情查询
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", java.util.List.of()
        ));
    }
}

