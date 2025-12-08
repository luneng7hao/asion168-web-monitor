package com.monitor.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.RangeQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.TermQuery;
import co.elastic.clients.elasticsearch.core.IndexRequest;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.json.JsonData;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.*;

/**
 * Elasticsearch 服务
 * 用于存储和查询监控日志
 */
@Service
@RequiredArgsConstructor
public class ElasticsearchService {
    
    @Autowired(required = false)
    private ElasticsearchClient client;
    
    private static final String INDEX_NAME = "monitor-logs";
    
    @PostConstruct
    public void init() {
        if (client != null) {
            try {
                // 检查连接
                boolean connected = client.ping().value();
                if (connected) {
                    System.out.println("✅ Elasticsearch connected successfully");
                    // 确保索引存在
                    ensureIndex();
                } else {
                    System.out.println("⚠️ Elasticsearch ping failed");
                }
            } catch (Exception e) {
                System.err.println("⚠️ Elasticsearch connection failed: " + e.getMessage());
                System.err.println("⚠️ Log query feature will be disabled");
            }
        } else {
            System.out.println("⚠️ Elasticsearch client not configured");
        }
    }
    
    /**
     * 确保索引存在
     */
    private void ensureIndex() {
        if (client == null) return;
        
        try {
            boolean exists = client.indices().exists(e -> e.index(INDEX_NAME)).value();
            if (!exists) {
                client.indices().create(c -> c
                    .index(INDEX_NAME)
                    .mappings(m -> m
                        .properties("projectId", p -> p.keyword(k -> k))
                        .properties("type", p -> p.keyword(k -> k))
                        .properties("userId", p -> p.keyword(k -> k))
                        .properties("sessionId", p -> p.keyword(k -> k))
                        .properties("url", p -> p.text(t -> t.fields("keyword", f -> f.keyword(k -> k))))
                        .properties("path", p -> p.text(t -> t.fields("keyword", f -> f.keyword(k -> k))))
                        .properties("message", p -> p.text(t -> t))
                        .properties("stack", p -> p.text(t -> t))
                        .properties("timestamp", p -> p.date(d -> d))
                        .properties("@timestamp", p -> p.date(d -> d))
                        .properties("userAgent", p -> p.text(t -> t))
                        .properties("errorType", p -> p.keyword(k -> k))
                        .properties("errorMessage", p -> p.text(t -> t))
                        .properties("loadTime", p -> p.integer(i -> i))
                        .properties("fcp", p -> p.float_(f -> f))
                        .properties("lcp", p -> p.float_(f -> f))
                        .properties("fid", p -> p.float_(f -> f))
                        .properties("cls", p -> p.float_(f -> f))
                        .properties("behaviorType", p -> p.keyword(k -> k))
                        .properties("method", p -> p.keyword(k -> k))
                        .properties("status", p -> p.integer(i -> i))
                        .properties("responseTime", p -> p.integer(i -> i))
                    )
                    .settings(s -> s
                        .numberOfShards("1")
                        .numberOfReplicas("0")
                    )
                );
                System.out.println("✅ Elasticsearch index created: " + INDEX_NAME);
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to ensure index: " + e.getMessage());
        }
    }
    
    /**
     * 检查连接状态
     */
    public boolean isConnected() {
        return client != null;
    }
    
    /**
     * 写入日志
     */
    public void writeLog(Map<String, Object> data) {
        if (client == null) {
            System.out.println("⚠️ Elasticsearch client not available, skipping log write");
            return;
        }
        
        try {
            Map<String, Object> doc = new HashMap<>(data);
            doc.put("@timestamp", Instant.now().toString());
            doc.put("rawData", data); // 保存完整原始数据
            
            IndexRequest<Map<String, Object>> request = IndexRequest.of(i -> i
                .index(INDEX_NAME)
                .document(doc)
            );
            
            client.index(request);
        } catch (Exception e) {
            System.err.println("❌ Elasticsearch write error: " + e.getMessage());
        }
    }
    
    /**
     * 查询日志
     */
    public Map<String, Object> searchLogs(Map<String, Object> params) {
        if (client == null) {
            return Map.of(
                "total", 0L,
                "hits", new ArrayList<>(),
                "page", params.getOrDefault("page", 1),
                "pageSize", params.getOrDefault("pageSize", 20)
            );
        }
        
        try {
            String projectId = (String) params.get("projectId");
            String userId = (String) params.get("userId");
            String type = (String) params.get("type");
            String keyword = (String) params.get("keyword");
            String startTime = (String) params.get("startTime");
            String endTime = (String) params.get("endTime");
            int page = (Integer) params.getOrDefault("page", 1);
            int pageSize = (Integer) params.getOrDefault("pageSize", 20);
            
            BoolQuery.Builder boolQuery = new BoolQuery.Builder();
            
            // 项目ID过滤
            if (projectId != null && !projectId.isEmpty()) {
                boolQuery.must(TermQuery.of(t -> t.field("projectId").value(projectId))._toQuery());
            }
            
            // 用户ID过滤
            if (userId != null && !userId.isEmpty()) {
                boolQuery.must(TermQuery.of(t -> t.field("userId").value(userId))._toQuery());
            }
            
            // 类型过滤（排除性能监控）
            if (type != null && !type.isEmpty()) {
                if ("performance".equals(type)) {
                    boolQuery.mustNot(TermQuery.of(t -> t.field("type").value("performance"))._toQuery());
                } else {
                    boolQuery.must(TermQuery.of(t -> t.field("type").value(type))._toQuery());
                }
            } else {
                // 默认排除性能监控
                boolQuery.mustNot(TermQuery.of(t -> t.field("type").value("performance"))._toQuery());
            }
            
            // 时间范围过滤
            RangeQuery.Builder rangeQuery = new RangeQuery.Builder().field("@timestamp");
            if (startTime != null && !startTime.isEmpty()) {
                rangeQuery.gte(JsonData.of(startTime));
            }
            if (endTime != null && !endTime.isEmpty()) {
                rangeQuery.lte(JsonData.of(endTime));
            }
            if (startTime != null || endTime != null) {
                boolQuery.must(rangeQuery.build()._toQuery());
            } else {
                // 默认查询最近7天
                Instant now = Instant.now();
                Instant sevenDaysAgo = now.minusSeconds(7 * 24 * 60 * 60);
                boolQuery.must(RangeQuery.of(r -> r
                    .field("@timestamp")
                    .gte(JsonData.of(sevenDaysAgo.toString()))
                    .lte(JsonData.of(now.toString()))
                )._toQuery());
            }
            
            Query query = boolQuery.build()._toQuery();
            
            SearchRequest searchRequest = SearchRequest.of(s -> s
                .index(INDEX_NAME)
                .query(query)
                .from((page - 1) * pageSize)
                .size(pageSize)
                .sort(so -> so.field(f -> f.field("@timestamp").order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)))
            );
            
            SearchResponse<Map> response = client.search(searchRequest, Map.class);
            
            List<Map<String, Object>> hits = new ArrayList<>();
            for (Hit<Map> hit : response.hits().hits()) {
                Map<String, Object> source = hit.source();
                if (source != null) {
                    Map<String, Object> hitData = new HashMap<>(source);
                    hitData.put("_id", hit.id());
                    hits.add(hitData);
                }
            }
            
            long total = response.hits().total().value();
            
            return Map.of(
                "total", total,
                "hits", hits,
                "page", page,
                "pageSize", pageSize
            );
        } catch (Exception e) {
            System.err.println("❌ Elasticsearch search error: " + e.getMessage());
            return Map.of(
                "total", 0L,
                "hits", new ArrayList<>(),
                "page", params.getOrDefault("page", 1),
                "pageSize", params.getOrDefault("pageSize", 20)
            );
        }
    }
    
    /**
     * 清除指定项目的所有监控日志
     */
    public void clearAllData(String projectId) {
        if (client == null) {
            System.out.println("⚠️ Elasticsearch client not available, skipping clear all data");
            return;
        }
        
        try {
            client.deleteByQuery(d -> d
                .index(INDEX_NAME)
                .query(TermQuery.of(t -> t.field("projectId").value(projectId))._toQuery())
                .refresh(true)
            );
            System.out.println("✅ Cleared all Elasticsearch data for project: " + projectId);
        } catch (Exception e) {
            System.err.println("❌ Failed to clear Elasticsearch data: " + e.getMessage());
        }
    }
    
    /**
     * 删除超过指定天数的监控日志
     */
    public void deleteOldData(String projectId, int days) {
        if (client == null) {
            System.out.println("⚠️ Elasticsearch client not available, skipping delete old data");
            return;
        }
        
        try {
            Instant cutoffTime = Instant.now().minusSeconds(days * 24L * 60 * 60);
            
            BoolQuery.Builder boolQuery = new BoolQuery.Builder();
            boolQuery.must(TermQuery.of(t -> t.field("projectId").value(projectId))._toQuery());
            boolQuery.must(RangeQuery.of(r -> r
                .field("@timestamp")
                .lt(JsonData.of(cutoffTime.toString()))
            )._toQuery());
            
            client.deleteByQuery(d -> d
                .index(INDEX_NAME)
                .query(boolQuery.build()._toQuery())
                .refresh(true)
            );
            
            System.out.println("✅ Deleted Elasticsearch data older than " + days + " days for project: " + projectId);
        } catch (Exception e) {
            System.err.println("❌ Failed to delete old Elasticsearch data: " + e.getMessage());
        }
    }
}

