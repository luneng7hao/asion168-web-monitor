package com.monitor.controller;

import com.monitor.service.PerformanceService;
import com.monitor.service.ElasticsearchService;
import com.monitor.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 性能监控控制器
 */
@RestController
@RequestMapping("/performance")
@RequiredArgsConstructor
public class PerformanceController {
    
    private final PerformanceService performanceService;
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
            System.err.println("Performance report GET failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", "数据解析失败"));
        }
    }
    
    private ResponseEntity<Map<String, Object>> handleReport(Map<String, Object> body) {
        try {
            performanceService.report(
                defaultProjectId,
                (String) body.getOrDefault("url", ""),
                (String) body.get("userId"),
                (String) body.get("sessionId"),
                body.get("loadTime") != null ? ((Number) body.get("loadTime")).longValue() : null,
                body.get("domReady") != null ? ((Number) body.get("domReady")).longValue() : null,
                body.get("fcp") != null ? ((Number) body.get("fcp")).longValue() : null,
                body.get("lcp") != null ? ((Number) body.get("lcp")).longValue() : null,
                body.get("fid") != null ? ((Number) body.get("fid")).longValue() : null,
                body.get("cls") != null ? ((Number) body.get("cls")).doubleValue() : null,
                body.get("dns") != null ? ((Number) body.get("dns")).longValue() : null,
                body.get("tcp") != null ? ((Number) body.get("tcp")).longValue() : null,
                body.get("ttfb") != null ? ((Number) body.get("ttfb")).longValue() : null
            );
            
            // 异步写入 Elasticsearch（不阻塞主流程）
            Map<String, Object> logData = new HashMap<>();
            logData.put("projectId", defaultProjectId);
            logData.put("type", "performance");
            logData.put("userId", body.get("userId"));
            logData.put("sessionId", body.get("sessionId"));
            logData.put("url", body.getOrDefault("url", ""));
            logData.put("timestamp", body.getOrDefault("timestamp", new java.util.Date().toInstant().toString()));
            logData.put("loadTime", body.get("loadTime"));
            logData.put("domReady", body.get("domReady"));
            logData.put("fcp", body.get("fcp"));
            logData.put("lcp", body.get("lcp"));
            logData.put("fid", body.get("fid"));
            logData.put("cls", body.get("cls"));
            logData.put("dns", body.get("dns"));
            logData.put("tcp", body.get("tcp"));
            logData.put("ttfb", body.get("ttfb"));
            logData.put("message", "Performance metrics: loadTime=" + body.getOrDefault("loadTime", 0) + "ms");
            
            try {
                elasticsearchService.writeLog(logData);
            } catch (Exception e) {
                System.out.println("⚠️ Elasticsearch write failed (non-blocking): " + e.getMessage());
            }
            
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            System.err.println("Performance report failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", "上报失败"));
        }
    }
    
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {
        
        // TODO: 实现性能数据列表查询
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", List.of(),
            "total", 0,
            "page", page,
            "pageSize", pageSize
        ));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = performanceService.getStats(defaultProjectId);
        return ResponseEntity.ok(Map.of("success", true, "data", stats));
    }
}

