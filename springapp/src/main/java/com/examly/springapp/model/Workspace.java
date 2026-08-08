package com.examly.springapp.model;

import javax.persistence.*;
import java.util.List;

@Entity
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "owner_email", nullable = false)
    private String ownerEmail;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "workspace_members", joinColumns = @JoinColumn(name = "workspace_id"))
    @Column(name = "member_email")
    private List<String> members = new java.util.ArrayList<>();

    public Workspace() {}

    public Workspace(String name, String ownerEmail, List<String> members) {
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
