package com.monitor.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import lombok.Data;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Elasticsearch 配置
 */
@Configuration
@ConfigurationProperties(prefix = "elasticsearch")
@Data
public class ElasticsearchConfig {
    
    private String node = "http://localhost:9200";
    private String username;
    private String password;
    
    @Bean
    public ElasticsearchClient elasticsearchClient() {
        try {
            // 解析 URL
            String url = node;
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "http://" + url;
            }
            java.net.URL urlObj = new java.net.URL(url);
            String host = urlObj.getHost();
            int port = urlObj.getPort() == -1 ? (url.startsWith("https") ? 443 : 80) : urlObj.getPort();
            String scheme = urlObj.getProtocol();
            
            HttpHost httpHost = new HttpHost(host, port, scheme);
            var builder = RestClient.builder(httpHost);
            
            // 如果需要认证
            if (username != null && !username.isEmpty() && password != null && !password.isEmpty()) {
                org.apache.http.auth.AuthScope authScope = new org.apache.http.auth.AuthScope(host, port);
                org.apache.http.auth.UsernamePasswordCredentials credentials = 
                    new org.apache.http.auth.UsernamePasswordCredentials(username, password);
                org.apache.http.impl.client.BasicCredentialsProvider credentialsProvider = 
                    new org.apache.http.impl.client.BasicCredentialsProvider();
                credentialsProvider.setCredentials(authScope, credentials);
                
                builder.setHttpClientConfigCallback(httpClientBuilder -> {
                    httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider);
                    return httpClientBuilder;
                });
            }
            
            RestClient restClient = builder.build();
            ElasticsearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
            ElasticsearchClient client = new ElasticsearchClient(transport);
            
            // 测试连接
            boolean connected = client.ping().value();
            if (connected) {
                System.out.println("✅ Elasticsearch connected successfully");
            } else {
                System.out.println("⚠️ Elasticsearch ping failed");
            }
            
            return client;
        } catch (Exception e) {
            System.err.println("⚠️ Elasticsearch connection failed: " + e.getMessage());
            System.err.println("⚠️ Log query feature will be disabled");
            System.err.println("⚠️ Please ensure Elasticsearch is running at: " + node);
            return null;
        }
    }
}

