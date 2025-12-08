package com.monitor.service;

import com.monitor.entity.ErrorLog;
import com.monitor.repository.ErrorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 错误服务
 */
@Service
@RequiredArgsConstructor
public class ErrorService {
    
    private final ErrorLogRepository errorLogRepository;
    private final InfluxDBService influxDBService;
    private final CacheService cacheService;
    
    /**
     * 生成错误指纹
     */
    private String generateErrorHash(String message, String stack, String url) {
        try {
            String content = message + "|" + 
                (stack != null ? stack.substring(0, Math.min(200, stack.length())) : "") + "|" + 
                (url != null ? url : "");
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hashBytes = md.digest(content.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            String content = message + "|" + 
                (stack != null ? stack.substring(0, Math.min(200, stack.length())) : "") + "|" + 
                (url != null ? url : "");
            return String.valueOf(content.hashCode());
        }
    }
    
    /**
     * 上报错误
     */
    public ErrorLog report(String projectId, String type, String message, String stack,
                          String url, Integer line, Integer col, String userAgent,
                          String userId, String sessionId) {
        Date timestamp = new Date();
        String errorHash = generateErrorHash(message, stack, url);
        
        // 查找已存在的相同错误
        Optional<ErrorLog> existingErrorOpt = errorLogRepository.findByProjectIdAndErrorHash(projectId, errorHash);
        
        ErrorLog error;
        if (existingErrorOpt.isPresent()) {
            // 更新已有错误
            ErrorLog existingError = existingErrorOpt.get();
            String currentUser = userId != null ? userId : (sessionId != null ? sessionId : "anonymous");
            String errorId = existingError.getId();
            
            // 使用 Redis Set 统计受影响用户数
            cacheService.addToUserSet(errorId, currentUser);
            Long actualUserCount = cacheService.getUserSetSize(errorId);
            
            existingError.setCount(existingError.getCount() + 1);
            existingError.setLastSeen(timestamp);
            existingError.setAffectedUsers(actualUserCount.intValue());
            
            error = errorLogRepository.save(existingError);
        } else {
            // 创建新错误记录
            error = new ErrorLog();
            error.setProjectId(projectId);
            error.setType(type != null ? type : "js");
            error.setMessage(message);
            error.setStack(stack);
            error.setUrl(url);
            error.setLine(line);
            error.setCol(col);
            error.setUserAgent(userAgent);
            error.setUserId(userId);
            error.setSessionId(sessionId);
            error.setTimestamp(timestamp);
            error.setErrorHash(errorHash);
            error.setCount(1);
            error.setFirstSeen(timestamp);
            error.setLastSeen(timestamp);
            error.setAffectedUsers(1);
            
            error = errorLogRepository.save(error);
            
            // 初始化用户集合
            String currentUser = userId != null ? userId : (sessionId != null ? sessionId : "anonymous");
            cacheService.addToUserSet(error.getId(), currentUser);
        }
        
        // 写入 InfluxDB
        influxDBService.writeErrorCount(projectId, type != null ? type : "js");
        
        // 更新实时计数
        cacheService.incrTodayErrorCount(projectId);
        
        // 清除统计缓存
        cacheService.delete("error:stats:" + projectId);
        cacheService.delete("dashboard:" + projectId);
        
        return error;
    }
    
    /**
     * 获取错误列表
     */
    public Map<String, Object> findList(String projectId, String type, Integer page, Integer pageSize,
                                        String startTime, String endTime) {
        Pageable pageable = PageRequest.of(
            (page != null && page > 0 ? page - 1 : 0),
            (pageSize != null && pageSize > 0 ? pageSize : 20),
            Sort.by(Sort.Direction.DESC, "lastSeen")
        );
        
        Page<ErrorLog> pageResult;
        if (type != null && !type.isEmpty()) {
            pageResult = errorLogRepository.findByProjectIdAndType(projectId, type, pageable);
        } else {
            pageResult = errorLogRepository.findByProjectId(projectId, pageable);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("data", pageResult.getContent());
        result.put("total", pageResult.getTotalElements());
        result.put("page", page != null && page > 0 ? page : 1);
        result.put("pageSize", pageSize != null && pageSize > 0 ? pageSize : 20);
        
        return result;
    }
    
    /**
     * 获取错误详情
     */
    public Optional<ErrorLog> findById(String id) {
        return errorLogRepository.findById(id);
    }
    
    /**
     * 获取错误统计
     */
    public Map<String, Object> getStats(String projectId) {
        // 尝试从缓存获取
        Map<String, Object> cached = cacheService.get("error:stats:" + projectId, Map.class);
        if (cached != null) {
            return cached;
        }
        
        try {
            // 获取总错误数
            long total = errorLogRepository.countByProjectId(projectId);
            
            // 按类型统计
            List<ErrorLog> typeStats = errorLogRepository.findTypeStatsByProjectId(projectId);
            Map<String, Long> typeStatsMap = new HashMap<>();
            for (ErrorLog error : typeStats) {
                typeStatsMap.put(error.getType(), 
                    typeStatsMap.getOrDefault(error.getType(), 0L) + error.getCount());
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("total", total);
            stats.put("typeStats", typeStatsMap);
            stats.put("timeStats", new HashMap<>()); // TODO: 从 InfluxDB 查询时间趋势
            
            // 缓存结果
            cacheService.set("error:stats:" + projectId, stats, 60L);
            
            return stats;
        } catch (Exception e) {
            System.err.println("Error stats query failed: " + e.getMessage());
            Map<String, Object> stats = new HashMap<>();
            stats.put("total", 0L);
            stats.put("typeStats", new HashMap<>());
            stats.put("timeStats", new HashMap<>());
            return stats;
        }
    }
}

