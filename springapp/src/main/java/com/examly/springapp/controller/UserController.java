package com.examly.springapp.controller;

import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(currentUser);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody User updatedUser, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        currentUser.setName(updatedUser.getName());
        currentUser.setPassword(updatedUser.getPassword());
        User savedUser = userRepository.save(currentUser);
        session.setAttribute("currentUser", savedUser);
        return ResponseEntity.ok(savedUser);
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers(@RequestParam String adminEmail) {
        if (!"admin@example.com".equals(adminEmail)) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Unauthorized. Only administrators can list all users.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestParam String adminEmail) {
        if (!"admin@example.com".equals(adminEmail)) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Unauthorized. Only administrators can delete users.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }
}
