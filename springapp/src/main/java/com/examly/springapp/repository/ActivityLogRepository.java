package com.examly.springapp.repository;

import com.examly.springapp.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByBoardIdOrderByCreatedAtDesc(Long boardId);
    List<ActivityLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}
