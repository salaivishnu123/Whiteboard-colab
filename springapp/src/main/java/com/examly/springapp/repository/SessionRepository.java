package com.examly.springapp.repository;

import com.examly.springapp.model.CollaborationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionRepository extends JpaRepository<CollaborationSession, Long> {
}
