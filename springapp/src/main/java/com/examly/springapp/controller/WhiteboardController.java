package com.examly.springapp.controller;

import com.examly.springapp.model.Whiteboard;
import com.examly.springapp.repository.WhiteboardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/whiteboards")
public class WhiteboardController {

    @Autowired
    private WhiteboardRepository whiteboardRepository;

    @Autowired
    private com.examly.springapp.repository.BoardMemberRepository boardMemberRepository;

    @GetMapping
    public ResponseEntity<List<Whiteboard>> listWhiteboards(@RequestParam(required = false) Long workspaceId) {
        if (workspaceId != null) {
            return ResponseEntity.ok(whiteboardRepository.findByWorkspaceId(workspaceId));
        }
        return ResponseEntity.ok(whiteboardRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Whiteboard> createWhiteboard(@RequestBody Whiteboard whiteboard) {
        if (whiteboard.getCanvasData() == null) {
            whiteboard.setCanvasData("");
        }
        Whiteboard savedWb = whiteboardRepository.save(whiteboard);
        if (whiteboard.getOwnerEmail() != null && !whiteboard.getOwnerEmail().trim().isEmpty()) {
            com.examly.springapp.model.BoardMember owner = new com.examly.springapp.model.BoardMember(
                savedWb.getId(), 
                whiteboard.getOwnerEmail().trim(), 
                "Owner", 
                new java.util.Date()
            );
            boardMemberRepository.save(owner);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(savedWb);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Whiteboard> getWhiteboard(@PathVariable Long id) {
        Optional<Whiteboard> wbOpt = whiteboardRepository.findById(id);
        if (wbOpt.isPresent()) {
            return ResponseEntity.ok(wbOpt.get());
        } else {
            // Auto-create whiteboard for workspace
            Whiteboard newWb = new Whiteboard("Whiteboard " + id, id, "");
            newWb.setId(id); // Keep the ID aligned with the workspace/request ID
            Whiteboard savedWb = whiteboardRepository.save(newWb);
            return ResponseEntity.ok(savedWb);
        }
    }

    @PutMapping("/{id}/canvas")
    public ResponseEntity<?> saveCanvas(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String canvasData = body.get("canvasData");
        Optional<Whiteboard> wbOpt = whiteboardRepository.findById(id);
        Whiteboard whiteboard;
        if (wbOpt.isPresent()) {
            whiteboard = wbOpt.get();
            whiteboard.setCanvasData(canvasData);
        } else {
            whiteboard = new Whiteboard("Whiteboard " + id, id, canvasData);
            whiteboard.setId(id);
        }
        Whiteboard savedWb = whiteboardRepository.save(whiteboard);
        return ResponseEntity.ok(savedWb);
    }

    @PostMapping("/{id}/export")
    public ResponseEntity<byte[]> exportCanvas(@PathVariable Long id) {
        Optional<Whiteboard> wbOpt = whiteboardRepository.findById(id);
        String dataUrl = wbOpt.isPresent() ? wbOpt.get().getCanvasData() : null;

        byte[] imageBytes;
        if (dataUrl != null && dataUrl.contains("base64,")) {
            try {
                String base64Data = dataUrl.split("base64,")[1];
                imageBytes = Base64.getDecoder().decode(base64Data);
            } catch (Exception e) {
                // Fallback on corrupt base64
                String transparentPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                imageBytes = Base64.getDecoder().decode(transparentPng);
            }
        } else {
            // 1x1 transparent PNG fallback
            String transparentPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            imageBytes = Base64.getDecoder().decode(transparentPng);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(imageBytes);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWhiteboard(@PathVariable Long id, @RequestBody Whiteboard whiteboardDetails) {
        Optional<Whiteboard> wbOpt = whiteboardRepository.findById(id);
        if (wbOpt.isPresent()) {
            Whiteboard whiteboard = wbOpt.get();
            whiteboard.setName(whiteboardDetails.getName());
            Whiteboard updatedWb = whiteboardRepository.save(whiteboard);
            return ResponseEntity.ok(updatedWb);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Whiteboard not found");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWhiteboard(@PathVariable Long id) {
        Optional<Whiteboard> wbOpt = whiteboardRepository.findById(id);
        if (wbOpt.isPresent()) {
            whiteboardRepository.delete(wbOpt.get());
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Whiteboard deleted successfully");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Whiteboard not found");
    }
}
