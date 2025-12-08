package com.monitor.controller;

import com.monitor.service.DataCleanupService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 数据清理控制器
 */
@RestController
@RequestMapping("/data-cleanup")
@RequiredArgsConstructor
public class DataCleanupController {
    
    private final DataCleanupService dataCleanupService;
    
    @Value("${default-project-id:001}")
    private String defaultProjectId;
    
    @PostMapping("/clear-all")
    public ResponseEntity<Map<String, Object>> clearAll() {
        try {
            dataCleanupService.clearAllData(defaultProjectId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "所有监控数据已清除"
            ));
        } catch (Exception e) {
            System.err.println("Clear all data failed: " + e.getMessage());
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "清除数据失败: " + (e.getMessage() != null ? e.getMessage() : "未知错误")
            ));
        }
    }
}

