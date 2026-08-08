package com.examly.springapp.repository;

import com.examly.springapp.model.BoardInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BoardInvitationRepository extends JpaRepository<BoardInvitation, Long> {
    Optional<BoardInvitation> findByToken(String token);
    Optional<BoardInvitation> findByBoardIdAndEmailAndStatus(Long boardId, String email, String status);
}
