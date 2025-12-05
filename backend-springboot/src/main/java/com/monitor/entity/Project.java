package com.monitor.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/**
 * 项目实体 - MongoDB
 */
@Document(collection = "projects")
@Data
public class Project {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String projectId;
    
    private String name;
    
    private String description = "";
    
    private Boolean isActive = true;
    
    private Date createdAt;
    
    private Date updatedAt;
}

