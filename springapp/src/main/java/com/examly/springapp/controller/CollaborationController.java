package com.examly.springapp.controller;

import com.examly.springapp.model.*;
import com.examly.springapp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class CollaborationController {

    @Autowired
    private BoardMemberRepository boardMemberRepository;

    @Autowired
    private BoardInvitationRepository boardInvitationRepository;

    @Autowired
    private WhiteboardRepository whiteboardRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    // 1. POST /api/boards/{id}/invite - Send invitation
    @PostMapping("/boards/{id}/invite")
    public ResponseEntity<?> inviteCollaborator(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String email = body.get("email");
        String role = body.get("role"); // Viewer, Commenter, Editor
        String invitedByEmail = body.get("invitedByEmail");

        if (email == null || role == null || invitedByEmail == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
        }

        Optional<Whiteboard> wbOpt = whiteboardRepository.findById(id);
        if (!wbOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Board not found"));
        }
        Whiteboard board = wbOpt.get();

        // Check if already a member
        Optional<BoardMember> existingMember = boardMemberRepository.findByBoardIdAndUserEmail(id, email);
        if (existingMember.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "User already has access to this board"));
        }

        // Generate secure token
        String token = UUID.randomUUID().toString();
        
        // Expiration in 48 hours
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.HOUR, 48);
        Date expirationTime = cal.getTime();

        // Create Invitation
        BoardInvitation invitation = new BoardInvitation(id, email, role, token, "Pending", expirationTime);
        BoardInvitation savedInvite = boardInvitationRepository.save(invitation);

        // Generate activity log
        ActivityLog log = new ActivityLog(id, invitedByEmail, "invited user", email + " as " + role, new Date());
        activityLogRepository.save(log);

        // Generate notification
        Notification notif = new Notification(email, "invite", 
            invitedByEmail + " invited you to collaborate on board '" + board.getName() + "' as " + role, 
            false, new Date());
        notificationRepository.save(notif);

        // Simulate sending email by printing in console
        System.out.println("=================================================");
        System.out.println("EMAIL SIMULATION: OUTBOUND INVITATION");
        System.out.println("To: " + email);
        System.out.println("Board Name: " + board.getName());
        System.out.println("Invited By: " + invitedByEmail);
        System.out.println("Assigned Role: " + role);
        System.out.println("Accept Link: http://localhost:8081/invite/" + token);
        System.out.println("=================================================");

        return ResponseEntity.ok(Map.of(
            "message", "Invitation sent successfully",
            "token", token,
            "invitation", savedInvite
        ));
    }

    // 2. GET /api/invite/{token} - Get invitation details
    @GetMapping("/invite/{token}")
    public ResponseEntity<?> getInvitation(@PathVariable String token) {
        Optional<BoardInvitation> inviteOpt = boardInvitationRepository.findByToken(token);
        if (!inviteOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Invitation link is invalid or expired"));
        }
        BoardInvitation invitation = inviteOpt.get();

        Optional<Whiteboard> wbOpt = whiteboardRepository.findById(invitation.getBoardId());
        if (!wbOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Board no longer exists"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("invitation", invitation);
        response.put("board", wbOpt.get());
        return ResponseEntity.ok(response);
    }

    // 3. POST /api/invite/{token}/accept - Accept invite
    @PostMapping("/invite/{token}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable String token, @RequestBody Map<String, String> body) {
        String email = body.get("email");
        Optional<BoardInvitation> inviteOpt = boardInvitationRepository.findByToken(token);
        if (!inviteOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Invitation invalid"));
        }
        BoardInvitation invitation = inviteOpt.get();

        if (!invitation.getEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Invitation email mismatch"));
        }

        invitation.setStatus("Accepted");
        invitation.setAcceptedAt(new Date());
        boardInvitationRepository.save(invitation);

        // Add user as board member
        Optional<BoardMember> existingMember = boardMemberRepository.findByBoardIdAndUserEmail(invitation.getBoardId(), email);
        if (!existingMember.isPresent()) {
            BoardMember newMember = new BoardMember(invitation.getBoardId(), email, invitation.getRole(), new Date());
            boardMemberRepository.save(newMember);
        }

        // Log Activity
        ActivityLog log = new ActivityLog(invitation.getBoardId(), email, "accepted invitation", "joined board", new Date());
        activityLogRepository.save(log);

        // Trigger Notification
        Notification notif = new Notification(email, "accept", "You accepted invitation to board ID " + invitation.getBoardId(), true, new Date());
        notificationRepository.save(notif);

        return ResponseEntity.ok(Map.of("message", "Invitation accepted successfully", "boardId", invitation.getBoardId()));
    }

    // 4. POST /api/invite/{token}/reject - Reject invite
    @PostMapping("/invite/{token}/reject")
    public ResponseEntity<?> rejectInvitation(@PathVariable String token, @RequestBody Map<String, String> body) {
        String email = body.get("email");
        Optional<BoardInvitation> inviteOpt = boardInvitationRepository.findByToken(token);
        if (!inviteOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Invitation invalid"));
        }
        BoardInvitation invitation = inviteOpt.get();

        if (!invitation.getEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Email mismatch"));
        }

        invitation.setStatus("Rejected");
        boardInvitationRepository.save(invitation);

        return ResponseEntity.ok(Map.of("message", "Invitation declined successfully"));
    }

    // 5. GET /api/boards/{id}/members - Retrieve board members
    @GetMapping("/boards/{id}/members")
    public ResponseEntity<?> getBoardMembers(@PathVariable Long id) {
        List<BoardMember> members = boardMemberRepository.findByBoardId(id);
        List<Map<String, Object>> response = new ArrayList<>();

        for (BoardMember m : members) {
            Map<String, Object> memberInfo = new HashMap<>();
            memberInfo.put("id", m.getId());
            memberInfo.put("boardId", m.getBoardId());
            memberInfo.put("userEmail", m.getUserEmail());
            memberInfo.put("role", m.getRole());
            memberInfo.put("joinedAt", m.getJoinedAt());

            // Query name from UserRepository if exists
            Optional<User> userOpt = userRepository.findByEmail(m.getUserEmail());
            if (userOpt.isPresent()) {
                memberInfo.put("name", userOpt.get().getName());
            } else {
                memberInfo.put("name", m.getUserEmail().split("@")[0]);
            }
            
            // Hardcode some online status matching avatars simulation
            boolean isOnline = m.getUserEmail().contains("admin") || m.getUserEmail().contains("john") || m.getUserEmail().contains("alice") || m.getUserEmail().contains("bob");
            memberInfo.put("online", isOnline);

            response.add(memberInfo);
        }

        return ResponseEntity.ok(response);
    }

    // 6. PATCH /api/boards/{id}/member-role - Modify collaborator role
    @PatchMapping("/boards/{id}/member-role")
    public ResponseEntity<?> changeMemberRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String email = body.get("email");
        String role = body.get("role");

        Optional<BoardMember> memberOpt = boardMemberRepository.findByBoardIdAndUserEmail(id, email);
        if (memberOpt.isPresent()) {
            BoardMember member = memberOpt.get();
            member.setRole(role);
            BoardMember updated = boardMemberRepository.save(member);

            // Log activity & notify
            activityLogRepository.save(new ActivityLog(id, "admin@example.com", "updated role of " + email, "to " + role, new Date()));
            notificationRepository.save(new Notification(email, "role", "Your role has been changed to " + role, false, new Date()));

            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Member not found"));
    }

    // 7. DELETE /api/boards/{id}/member - Remove collaborator
    @DeleteMapping("/boards/{id}/member")
    public ResponseEntity<?> removeMember(@PathVariable Long id, @RequestParam String email) {
        Optional<BoardMember> memberOpt = boardMemberRepository.findByBoardIdAndUserEmail(id, email);
        if (memberOpt.isPresent()) {
            boardMemberRepository.delete(memberOpt.get());

            // Log activity & notify
            activityLogRepository.save(new ActivityLog(id, "admin@example.com", "removed collaborator", email, new Date()));
            notificationRepository.save(new Notification(email, "role", "You have been removed from whiteboard ID " + id, false, new Date()));

            return ResponseEntity.ok(Map.of("message", "Collaborator removed successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Collaborator not found"));
    }

    // 8. POST /api/boards/{id}/share-link - Update visibility
    @PostMapping("/boards/{id}/share-link")
    public ResponseEntity<?> updateShareLink(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String visibility = body.get("visibility"); // Private, View, Comment, Edit
        Optional<Whiteboard> wbOpt = whiteboardRepository.findById(id);
        if (wbOpt.isPresent()) {
            Whiteboard whiteboard = wbOpt.get();
            whiteboard.setVisibility(visibility);
            Whiteboard saved = whiteboardRepository.save(whiteboard);
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Board not found"));
    }
}
