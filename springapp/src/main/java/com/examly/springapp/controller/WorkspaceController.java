package com.examly.springapp.controller;

import com.examly.springapp.model.Workspace;
import com.examly.springapp.repository.WorkspaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @GetMapping
    public ResponseEntity<Page<Workspace>> listWorkspaces(
            @RequestParam String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Workspace> workspaces;
        if ("admin@example.com".equals(email)) {
            workspaces = workspaceRepository.findAll(pageable);
        } else {
            workspaces = workspaceRepository.findByEmail(email, pageable);
        }
        return ResponseEntity.ok(workspaces);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getWorkspace(@PathVariable Long id) {
        Optional<Workspace> workspaceOpt = workspaceRepository.findById(id);
        if (workspaceOpt.isPresent()) {
            return ResponseEntity.ok(workspaceOpt.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Workspace not found");
    }

    @PostMapping
    public ResponseEntity<Workspace> createWorkspace(@RequestBody Workspace workspace) {
        Workspace savedWorkspace = workspaceRepository.save(workspace);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedWorkspace);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorkspace(@PathVariable Long id, @RequestBody Workspace workspaceDetails) {
        Optional<Workspace> workspaceOpt = workspaceRepository.findById(id);
        if (workspaceOpt.isPresent()) {
            Workspace workspace = workspaceOpt.get();
            workspace.setName(workspaceDetails.getName());
            workspace.setMembers(workspaceDetails.getMembers());
            Workspace updatedWorkspace = workspaceRepository.save(workspace);
            return ResponseEntity.ok(updatedWorkspace);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Workspace not found");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkspace(@PathVariable Long id) {
        Optional<Workspace> workspaceOpt = workspaceRepository.findById(id);
        if (workspaceOpt.isPresent()) {
            workspaceRepository.delete(workspaceOpt.get());
            return ResponseEntity.ok("Workspace deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Workspace not found");
    }
}
