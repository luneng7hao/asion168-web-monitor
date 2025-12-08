package com.monitor.controller;

import com.monitor.entity.Project;
import com.monitor.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 项目管理控制器
 */
@RestController
@RequestMapping("/project")
@RequiredArgsConstructor
public class ProjectController {
    
    private final ProjectService projectService;
    
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> list() {
        List<Project> projects = projectService.findAll();
        return ResponseEntity.ok(Map.of("success", true, "data", projects));
    }
    
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "name 是必需的"));
        }
        
        Project project = projectService.create(name, body.get("description"));
        return ResponseEntity.ok(Map.of("success", true, "data", project));
    }
    
    @PutMapping("/update/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        Optional<Project> projectOpt = projectService.update(id, body.get("name"), body.get("description"));
        if (projectOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "项目不存在"));
        }
        return ResponseEntity.ok(Map.of("success", true, "data", projectOpt.get()));
    }
    
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        boolean deleted = projectService.delete(id);
        if (!deleted) {
            return ResponseEntity.ok(Map.of("success", false, "message", "项目不存在"));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }
}

