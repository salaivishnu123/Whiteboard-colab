package com.examly.springapp.model;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "board_invitations")
public class BoardInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "board_id", nullable = false)
    private Long boardId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role; // Editor, Commenter, Viewer

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String status; // Pending, Accepted, Rejected

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "expiration_time")
    private Date expirationTime;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "accepted_at")
    private Date acceptedAt;

    public BoardInvitation() {}

    public BoardInvitation(Long boardId, String email, String role, String token, String status, Date expirationTime) {
        this.boardId = boardId;
        this.email = email;
        this.role = role;
        this.token = token;
        this.status = status;
        this.expirationTime = expirationTime;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBoardId() { return boardId; }
    public void setBoardId(Long boardId) { this.boardId = boardId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getExpirationTime() { return expirationTime; }
    public void setExpirationTime(Date expirationTime) { this.expirationTime = expirationTime; }

    public Date getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Date acceptedAt) { this.acceptedAt = acceptedAt; }
}
