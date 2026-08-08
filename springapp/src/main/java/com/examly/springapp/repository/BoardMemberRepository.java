package com.examly.springapp.repository;

import com.examly.springapp.model.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {
    List<BoardMember> findByBoardId(Long boardId);
    Optional<BoardMember> findByBoardIdAndUserEmail(Long boardId, String userEmail);
    void deleteByBoardIdAndUserEmail(Long boardId, String userEmail);
}
