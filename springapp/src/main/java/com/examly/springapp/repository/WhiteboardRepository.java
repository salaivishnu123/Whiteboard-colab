package com.examly.springapp.repository;

import com.examly.springapp.model.Whiteboard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WhiteboardRepository extends JpaRepository<Whiteboard, Long> {
    List<Whiteboard> findByWorkspaceId(Long workspaceId);
}
