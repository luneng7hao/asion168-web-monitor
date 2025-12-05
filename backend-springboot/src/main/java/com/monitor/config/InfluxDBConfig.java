package com.monitor.config;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * InfluxDB 配置
 */
@Configuration
@ConfigurationProperties(prefix = "influxdb")
@Data
public class InfluxDBConfig {
    
    private String url = "http://localhost:8086";
    private String token = "";
    private String org = "";
    private String bucket = "monitor";
    private String database = "monitor";
    
    @Bean
    public InfluxDBClient influxDBClient() {
        try {
            // InfluxDB 2.x 需要 token，如果为空则使用空字符串
            char[] tokenChars = (token != null && !token.isEmpty()) ? token.toCharArray() : "".toCharArray();
            InfluxDBClient client = InfluxDBClientFactory.create(
                url,
                tokenChars,
                org != null ? org : "",
                bucket
            );
            System.out.println("✅ InfluxDB connected");
            return client;
        } catch (Exception e) {
            System.err.println("⚠️ InfluxDB connection failed, time-series features disabled: " + e.getMessage());
            return null;
        }
    }
}

