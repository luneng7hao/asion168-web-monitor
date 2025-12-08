package com.monitor.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 日期时间格式化工具
 */
public class DateUtil {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    /**
     * 格式化日期时间为 "yyyy-MM-dd HH:mm:ss" 格式
     * @param date 日期对象、时间戳或日期字符串
     * @return 格式化后的日期时间字符串，如 "2025-06-03 13:00:21"
     */
    public static String formatDateTime(Object date) {
        if (date == null) {
            return null;
        }
        
        try {
            LocalDateTime dateTime;
            
            if (date instanceof java.util.Date) {
                dateTime = LocalDateTime.ofInstant(((java.util.Date) date).toInstant(), ZoneId.systemDefault());
            } else if (date instanceof Long) {
                dateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli((Long) date), ZoneId.systemDefault());
            } else if (date instanceof String) {
                // 尝试解析 ISO 格式或时间戳
                String dateStr = (String) date;
                if (dateStr.matches("\\d+")) {
                    // 时间戳
                    dateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(Long.parseLong(dateStr)), ZoneId.systemDefault());
                } else {
                    // ISO 格式
                    Instant instant = Instant.parse(dateStr);
                    dateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
                }
            } else {
                return null;
            }
            
            return dateTime.format(FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }
}

