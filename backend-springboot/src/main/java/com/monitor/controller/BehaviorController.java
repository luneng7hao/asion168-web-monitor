package com.monitor.controller;

import com.monitor.service.BehaviorService;
import com.monitor.service.ElasticsearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户行为控制器
 */
@RestController
@RequestMapping("/behavior")
@RequiredArgsConstructor
public class BehaviorController {
    
    private final BehaviorService behaviorService;
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
            System.err.println("Behavior report GET failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", "数据解析失败"));
        }
    }
    
    private ResponseEntity<Map<String, Object>> handleReport(Map<String, Object> body) {
        try {
            // 调试日志：记录路由变化和自定义事件的 userId
            String type = (String) body.getOrDefault("type", "pv");
            if ("route-change".equals(type) || "custom".equals(type)) {
                System.out.println("📊 " + type + " event - userId: " + body.get("userId") + ", sessionId: " + body.get("sessionId"));
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            
            behaviorService.report(
                defaultProjectId,
                type,
                (String) body.getOrDefault("url", ""),
                (String) body.get("path"),
                (String) body.get("userId"),
                (String) body.get("sessionId")
            );
            
            // 异步写入 Elasticsearch（不阻塞主流程）
            Map<String, Object> logData = new HashMap<>();
            logData.put("projectId", defaultProjectId);
            logData.put("type", "behavior");
            logData.put("userId", body.get("userId"));
            logData.put("sessionId", body.get("sessionId"));
            logData.put("url", body.getOrDefault("url", ""));
            logData.put("path", body.get("path"));
            logData.put("timestamp", body.getOrDefault("timestamp", new java.util.Date().toInstant().toString()));
            logData.put("behaviorType", type);
            
            String message;
            if ("route-change".equals(type)) {
                message = "Route change: " + (data != null ? data.get("from") : "") + " -> " + (data != null ? data.get("to") : "");
            } else if ("custom".equals(type)) {
                message = "Custom event: " + (data != null ? data.get("eventName") : "");
            } else {
                message = type;
            }
            logData.put("message", message);
            
            if (data != null) {
                logData.putAll(data);
            }
            
            try {
                elasticsearchService.writeLog(logData);
            } catch (Exception e) {
                System.out.println("⚠️ Elasticsearch write failed (non-blocking): " + e.getMessage());
            }
            
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            System.err.println("Behavior report failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", "上报失败"));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(@RequestParam(required = false) String type) {
        Map<String, Object> stats = behaviorService.getStats(defaultProjectId, type);
        return ResponseEntity.ok(Map.of("success", true, "data", stats));
    }
    
    @GetMapping("/events")
    public ResponseEntity<Map<String, Object>> getEvents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {
        // TODO: 实现行为事件详情列表查询
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "list", java.util.List.of(),
                "total", 0,
                "page", page,
                "pageSize", pageSize
            )
        ));
    }
}

