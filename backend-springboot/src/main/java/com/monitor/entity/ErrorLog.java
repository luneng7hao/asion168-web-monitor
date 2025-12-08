package com.monitor.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/**
 * 错误详情实体 - MongoDB
 */
@Document(collection = "errors")
@Data
public class ErrorLog {
    
    @Id
    private String id;
    
    @Indexed
    private String projectId;
    
    private String type; // js, promise, resource
    
    private String message;
    
    private String stack;
    
    private String url;
    
    private Integer line;
    
    private Integer col;
    
    private String userAgent;
    
    private String userId;
    
    private String sessionId;
    
    private Date timestamp;
    
    @Indexed
    private String errorHash; // 错误指纹，用于聚合相同错误
    
    private Integer count = 1; // 错误发生次数（聚合后）
    
    private Date firstSeen; // 首次发生时间
    
    private Date lastSeen; // 最后发生时间
    
    private Integer affectedUsers = 0; // 影响用户数
    
    private Object context; // 错误上下文信息
    
    private String platform; // 平台信息
    
    private String appName; // 应用名称
    
    private Boolean isOnline; // 是否在线
    
    private Boolean isPWA; // 是否为 PWA
}

