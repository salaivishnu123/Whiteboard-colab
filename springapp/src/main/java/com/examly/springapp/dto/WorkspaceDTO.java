package com.examly.springapp.dto;

import java.util.List;

public class WorkspaceDTO {

    private Long id;
    private String name;
    private String ownerEmail;
    private List<String> members;

    public WorkspaceDTO() {}

    public WorkspaceDTO(Long id, String name, String ownerEmail, List<String> members) {
        this.id = id;
        this.name = name;
        this.ownerEmail = ownerEmail;
        this.members = members;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }

    public List<String> getMembers() { return members; }
    public void setMembers(List<String> members) { this.members = members; }
}
