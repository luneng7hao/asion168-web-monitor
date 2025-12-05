package com.monitor.controller;

import com.monitor.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Dashboard 控制器
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    
    private final DashboardService dashboardService;
    
    @Value("${default-project-id:001}")
    private String defaultProjectId;
    
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        Map<String, Object> data = dashboardService.getOverview(defaultProjectId);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }
}

