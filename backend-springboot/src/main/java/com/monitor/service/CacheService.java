package com.monitor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.TimeUnit;

/**
 * Redis 缓存服务
 */
@Service
@RequiredArgsConstructor
public class CacheService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final String PREFIX = "monitor:";
    
    /**
     * 获取缓存
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(PREFIX + key);
            if (value == null) {
                return null;
            }
            if (clazz.isInstance(value)) {
                return clazz.cast(value);
            }
            if (value instanceof String) {
                return objectMapper.readValue((String) value, clazz);
            }
            return objectMapper.convertValue(value, clazz);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * 设置缓存
     */
    public void set(String key, Object value, Long ttl) {
        if (ttl != null && ttl > 0) {
            redisTemplate.opsForValue().set(PREFIX + key, value, ttl, TimeUnit.SECONDS);
        } else {
            redisTemplate.opsForValue().set(PREFIX + key, value);
        }
    }
    
    /**
     * 删除缓存
     */
    public void delete(String key) {
        redisTemplate.delete(PREFIX + key);
    }
    
    /**
     * 增加计数
     */
    public Long increment(String key) {
        return redisTemplate.opsForValue().increment(PREFIX + key);
    }
    
    /**
     * 获取计数
     */
    public Long getCount(String key) {
        Object value = redisTemplate.opsForValue().get(PREFIX + key);
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
    
    /**
     * 添加到 Set
     */
    public Long addToSet(String key, String value) {
        return redisTemplate.opsForSet().add(PREFIX + key, value);
    }
    
    /**
     * 获取 Set 大小
     */
    public Long getSetSize(String key) {
        return redisTemplate.opsForSet().size(PREFIX + key);
    }
    
    /**
     * HyperLogLog 添加
     */
    public void pfAdd(String key, String value) {
        redisTemplate.opsForHyperLogLog().add(PREFIX + key, value);
    }
    
    /**
     * HyperLogLog 计数
     */
    public Long pfCount(String key) {
        return redisTemplate.opsForHyperLogLog().size(PREFIX + key);
    }
    
    /**
     * 设置过期时间（到明天凌晨）
     */
    public void expireAtTomorrow(String key) {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        long timestamp = tomorrow.atStartOfDay(ZoneId.systemDefault()).toEpochSecond();
        redisTemplate.expireAt(PREFIX + key, java.time.Instant.ofEpochSecond(timestamp));
    }
    
    /**
     * 设置过期时间（到指定时间戳）
     */
    public void expireAt(String key, java.time.Instant instant) {
        redisTemplate.expireAt(PREFIX + key, instant);
    }
    
    /**
     * 设置过期时间（天数）
     */
    public void expire(String key, long days) {
        redisTemplate.expire(PREFIX + key, days, TimeUnit.DAYS);
    }
    
    /**
     * 获取今日 key
     */
    public String getTodayKey() {
        return LocalDate.now().toString();
    }
    
    // Dashboard 缓存
    public <T> T getDashboard(String projectId, Class<T> clazz) {
        return get("dashboard:" + projectId, clazz);
    }
    
    public void setDashboard(String projectId, Object data, Long ttl) {
        set("dashboard:" + projectId, data, ttl);
    }
    
    // 错误统计缓存
    public <T> T getErrorStats(String projectId, Class<T> clazz) {
        return get("error:stats:" + projectId, clazz);
    }
    
    public void setErrorStats(String projectId, Object data, Long ttl) {
        set("error:stats:" + projectId, data, ttl);
    }
    
    // 今日错误计数
    public Long incrTodayErrorCount(String projectId) {
        String key = "error:today:" + projectId + ":" + getTodayKey();
        Long count = increment(key);
        expireAtTomorrow(key);
        return count;
    }
    
    public Long getTodayErrorCount(String projectId) {
        String key = "error:today:" + projectId + ":" + getTodayKey();
        return getCount(key);
    }
    
    // 今日 PV 计数
    public Long incrTodayPV(String projectId) {
        String key = "pv:today:" + projectId + ":" + getTodayKey();
        Long count = increment(key);
        expireAtTomorrow(key);
        return count;
    }
    
    public Long getTodayPV(String projectId) {
        String key = "pv:today:" + projectId + ":" + getTodayKey();
        return getCount(key);
    }
    
    // 今日 UV（HyperLogLog）
    public void addTodayUV(String projectId, String sessionId) {
        String key = "uv:today:" + projectId + ":" + getTodayKey();
        pfAdd(key, sessionId);
        expireAtTomorrow(key);
    }
    
    public Long getTodayUV(String projectId) {
        String key = "uv:today:" + projectId + ":" + getTodayKey();
        return pfCount(key);
    }
    
    // 错误受影响用户 Set
    public Long addToUserSet(String errorId, String userId) {
        String key = "error:users:" + errorId;
        Long result = addToSet(key, userId);
        expire(key, 30); // 30 天过期
        return result;
    }
    
    public Long getUserSetSize(String errorId) {
        String key = "error:users:" + errorId;
        return getSetSize(key);
    }
    
    /**
     * 清除指定项目的所有缓存
     */
    public void clearAllCache(String projectId) {
        // 获取所有匹配的 key
        java.util.Set<String> keys = redisTemplate.keys(PREFIX + "*:" + projectId + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}

