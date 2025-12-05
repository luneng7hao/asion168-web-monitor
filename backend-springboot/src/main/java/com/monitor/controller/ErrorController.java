package com.monitor.controller;

import com.monitor.entity.ErrorLog;
import com.monitor.service.ErrorService;
import com.monitor.service.ElasticsearchService;
import com.monitor.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 错误监控控制器
 */
@RestController
@RequestMapping("/error")
@RequiredArgsConstructor
public class ErrorController {
    
    private final ErrorService errorService;
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
            // URL 解码并解析 JSON
            String decoded = java.net.URLDecoder.decode(data, java.nio.charset.StandardCharsets.UTF_8);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> body = mapper.readValue(decoded, Map.class);
            return handleReport(body);
        } catch (Exception e) {
            System.err.println("Error report GET failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", "数据解析失败"));
        }
    }
    
    private ResponseEntity<Map<String, Object>> handleReport(Map<String, Object> body) {
        try {
            // 调试日志：记录接收到的错误信息
            if ("resource".equals(body.get("type"))) {
                System.out.println("📦 Resource error received: " + Map.of(
                    "type", body.getOrDefault("type", ""),
                    "message", body.getOrDefault("message", ""),
                    "url", body.getOrDefault("url", ""),
                    "userId", body.getOrDefault("userId", "")
                ));
            }
            
            ErrorLog error = errorService.report(
                defaultProjectId,
                (String) body.getOrDefault("type", "js"),
                (String) body.getOrDefault("message", "Unknown error"),
                (String) body.get("stack"),
                (String) body.get("url"),
                body.get("line") != null ? ((Number) body.get("line")).intValue() : null,
                body.get("col") != null ? ((Number) body.get("col")).intValue() : null,
                (String) body.get("userAgent"),
                (String) body.get("userId"),
                (String) body.get("sessionId")
            );
            
            if ("resource".equals(body.get("type"))) {
                System.out.println("✅ Resource error saved: " + error.getId());
            }
            
            // 异步写入 Elasticsearch（不阻塞主流程）
            Map<String, Object> logData = new HashMap<>();
            logData.put("projectId", defaultProjectId);
            logData.put("type", "error");
            logData.put("userId", body.get("userId"));
            logData.put("sessionId", body.get("sessionId"));
            logData.put("url", body.get("url"));
            logData.put("timestamp", new java.util.Date().toInstant().toString());
            logData.put("errorType", body.getOrDefault("type", "js"));
            logData.put("errorMessage", body.getOrDefault("message", "Unknown error"));
            logData.put("stack", body.get("stack"));
            logData.put("line", body.get("line"));
            logData.put("col", body.get("col"));
            logData.put("userAgent", body.get("userAgent"));
            logData.put("message", body.getOrDefault("message", "Unknown error"));
            
            try {
                elasticsearchService.writeLog(logData);
            } catch (Exception e) {
                System.out.println("⚠️ Elasticsearch write failed (non-blocking): " + e.getMessage());
            }
            
            return ResponseEntity.ok(Map.of("success", true, "id", error.getId()));
        } catch (Exception e) {
            System.err.println("Error report failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", "上报失败"));
        }
    }
    
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        
        Map<String, Object> result = errorService.findList(defaultProjectId, type, page, pageSize, startTime, endTime);
        
        // 格式化日期字段
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");
        if (data != null) {
            data = data.stream().map(item -> {
                Map<String, Object> formatted = new HashMap<>(item);
                if (item.get("timestamp") != null) {
                    formatted.put("timestamp", DateUtil.formatDateTime(item.get("timestamp")));
                }
                if (item.get("firstSeen") != null) {
                    formatted.put("firstSeen", DateUtil.formatDateTime(item.get("firstSeen")));
                }
                if (item.get("lastSeen") != null) {
                    formatted.put("lastSeen", DateUtil.formatDateTime(item.get("lastSeen")));
                }
                return formatted;
            }).collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", data != null ? data : List.of(),
            "total", result.get("total"),
            "page", result.get("page"),
            "pageSize", result.get("pageSize")
        ));
    }
    
    @GetMapping("/detail/{id}")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable String id) {
        Optional<ErrorLog> errorOpt = errorService.findById(id);
        if (errorOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "错误不存在"));
        }
        
        ErrorLog error = errorOpt.get();
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("id", error.getId());
        errorData.put("type", error.getType());
        errorData.put("message", error.getMessage());
        errorData.put("stack", error.getStack());
        errorData.put("url", error.getUrl());
        errorData.put("line", error.getLine());
        errorData.put("col", error.getCol());
        errorData.put("userAgent", error.getUserAgent());
        errorData.put("userId", error.getUserId());
        errorData.put("sessionId", error.getSessionId());
        errorData.put("timestamp", DateUtil.formatDateTime(error.getTimestamp()));
        errorData.put("firstSeen", DateUtil.formatDateTime(error.getFirstSeen()));
        errorData.put("lastSeen", DateUtil.formatDateTime(error.getLastSeen()));
        errorData.put("count", error.getCount());
        errorData.put("affectedUsers", error.getAffectedUsers());
        errorData.put("context", error.getContext());
        errorData.put("platform", error.getPlatform());
        errorData.put("appName", error.getAppName());
        errorData.put("isOnline", error.getIsOnline());
        errorData.put("isPWA", error.getIsPWA());
        
        return ResponseEntity.ok(Map.of("success", true, "data", errorData));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = errorService.getStats(defaultProjectId);
        return ResponseEntity.ok(Map.of("success", true, "data", stats));
    }
}

