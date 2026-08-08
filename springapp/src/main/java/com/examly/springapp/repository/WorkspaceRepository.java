package com.examly.springapp.repository;

import com.examly.springapp.model.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    @Query("SELECT DISTINCT w FROM Workspace w LEFT JOIN w.members m WHERE w.ownerEmail = :email OR m = :email")
    Page<Workspace> findByEmail(@Param("email") String email, Pageable pageable);
}
