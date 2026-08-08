package com.examly.springapp.model;

import javax.persistence.*;
import java.util.Date;

@Entity
public class CollaborationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sessionName;
    private Long whiteboardId;
    private String hostEmail;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();

    public CollaborationSession() {}

    public CollaborationSession(String sessionName, Long whiteboardId, String hostEmail) {
        this.sessionName = sessionName;
        this.whiteboardId = whiteboardId;
        this.hostEmail = hostEmail;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSessionName() { return sessionName; }
    public void setSessionName(String sessionName) { this.sessionName = sessionName; }

    public Long getWhiteboardId() { return whiteboardId; }
    public void setWhiteboardId(Long whiteboardId) { this.whiteboardId = whiteboardId; }

    public String getHostEmail() { return hostEmail; }
    public void setHostEmail(String hostEmail) { this.hostEmail = hostEmail; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
