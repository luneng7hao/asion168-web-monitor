package com.monitor.repository;

import com.monitor.entity.ErrorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface ErrorLogRepository extends MongoRepository<ErrorLog, String> {
    
    Optional<ErrorLog> findByProjectIdAndErrorHash(String projectId, String errorHash);
    
    Page<ErrorLog> findByProjectId(String projectId, Pageable pageable);
    
    Page<ErrorLog> findByProjectIdAndType(String projectId, String type, Pageable pageable);
    
    @Query("{ 'projectId': ?0, 'timestamp': { $gte: ?1, $lte: ?2 } }")
    Page<ErrorLog> findByProjectIdAndTimestampBetween(
        String projectId, Date startTime, Date endTime, Pageable pageable
    );
    
    long countByProjectId(String projectId);
    
    @Query(value = "{ 'projectId': ?0 }", fields = "{ 'type': 1, 'count': 1 }")
    List<ErrorLog> findTypeStatsByProjectId(String projectId);
}

