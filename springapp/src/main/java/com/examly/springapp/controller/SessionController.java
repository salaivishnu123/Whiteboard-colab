package com.examly.springapp.controller;

import com.examly.springapp.model.CollaborationSession;
import com.examly.springapp.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private SessionRepository sessionRepository;

    @GetMapping
    public ResponseEntity<List<CollaborationSession>> getAllSessions() {
        return ResponseEntity.ok(sessionRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<CollaborationSession> createSession(@RequestBody CollaborationSession session) {
        CollaborationSession saved = sessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CollaborationSession> getSessionById(@PathVariable Long id) {
        Optional<CollaborationSession> session = sessionRepository.findById(id);
        return session.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
