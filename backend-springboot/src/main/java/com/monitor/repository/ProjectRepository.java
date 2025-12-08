package com.monitor.repository;

import com.monitor.entity.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {
    
    Optional<Project> findByProjectId(String projectId);
    
    boolean existsByProjectId(String projectId);
}

