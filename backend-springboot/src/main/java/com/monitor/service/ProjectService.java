package com.monitor.service;

import com.monitor.entity.Project;
import com.monitor.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 项目服务
 */
@Service
@RequiredArgsConstructor
public class ProjectService {
    
    private final ProjectRepository projectRepository;
    private final CacheService cacheService;
    
    /**
     * 生成唯一项目ID
     */
    private String generateProjectId() {
        return "project-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 9);
    }
    
    /**
     * 创建项目
     */
    public Project create(String name, String description) {
        String projectId = generateProjectId();
        
        Project project = new Project();
        project.setProjectId(projectId);
        project.setName(name);
        project.setDescription(description != null ? description : "");
        project.setIsActive(true);
        project.setCreatedAt(new Date());
        project.setUpdatedAt(new Date());
        
        project = projectRepository.save(project);
        
        // 清除项目列表缓存
        cacheService.delete("projects:list");
        
        return project;
    }
    
    /**
     * 获取项目列表
     */
    public List<Project> findAll() {
        // 尝试从缓存获取
        List<Project> cached = cacheService.get("projects:list", List.class);
        if (cached != null) {
            return cached;
        }
        
        try {
            List<Project> projects = projectRepository.findAll();
            
            // 缓存结果
            cacheService.set("projects:list", projects, 300L);
            
            return projects;
        } catch (Exception e) {
            System.err.println("MongoDB query failed: " + e.getMessage());
            return List.of();
        }
    }
    
    /**
     * 根据项目ID获取项目
     */
    public Optional<Project> findByProjectId(String projectId) {
        return projectRepository.findByProjectId(projectId);
    }
    
    /**
     * 更新项目
     */
    public Optional<Project> update(String projectId, String name, String description) {
        Optional<Project> projectOpt = projectRepository.findByProjectId(projectId);
        if (projectOpt.isEmpty()) {
            return Optional.empty();
        }
        
        Project project = projectOpt.get();
        if (name != null) {
            project.setName(name);
        }
        if (description != null) {
            project.setDescription(description);
        }
        project.setUpdatedAt(new Date());
        
        project = projectRepository.save(project);
        
        // 清除缓存
        cacheService.delete("projects:list");
        
        return Optional.of(project);
    }
    
    /**
     * 删除项目（软删除）
     */
    public boolean delete(String projectId) {
        Optional<Project> projectOpt = projectRepository.findByProjectId(projectId);
        if (projectOpt.isEmpty()) {
            return false;
        }
        
        Project project = projectOpt.get();
        project.setIsActive(false);
        project.setUpdatedAt(new Date());
        projectRepository.save(project);
        
        // 清除缓存
        cacheService.delete("projects:list");
        
        return true;
    }
}

