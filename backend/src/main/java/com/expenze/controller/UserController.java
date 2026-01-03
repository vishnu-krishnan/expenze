package com.expenze.controller;

import com.expenze.dto.UserDto;
import com.expenze.security.CustomUserDetails;
import com.expenze.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal CustomUserDetails user) {
        log.debug("GET /profile - User ID: {}", user.getId());
        try {
            UserDto profile = userService.getProfile(user.getId());
            log.debug("Profile retrieved successfully for user: {}", user.getId());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Error getting profile for user {}: {}", user.getId(), e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal CustomUserDetails user, @RequestBody UserDto dto) {
        userService.updateProfile(user.getId(), dto);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/profile/request-email-change")
    public ResponseEntity<?> requestEmailChange(@AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, String> payload) {
        String newEmail = payload.get("newEmail");
        if (newEmail == null)
            return ResponseEntity.badRequest().body(Map.of("error", "New email required"));

        userService.requestEmailChange(user.getId(), newEmail);
        return ResponseEntity.ok(Map.of("message", "OTP sent to new email"));
    }

    @PostMapping("/profile/verify-email-change")
    public ResponseEntity<?> verifyEmailChange(@AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, String> payload) {
        String otp = payload.get("otp");
        if (otp == null)
            return ResponseEntity.badRequest().body(Map.of("error", "OTP required"));

        userService.verifyEmailChange(user.getId(), otp);
        return ResponseEntity.ok(Map.of("success", true, "message", "Email updated successfully!"));
    }

    // ADMIN

    @GetMapping("/admin/users")
    public ResponseEntity<?> getAllUsers() { // Security config restricts this to ADMIN
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<?> updateUserAdmin(@AuthenticationPrincipal CustomUserDetails admin, @PathVariable Long id,
            @RequestBody UserDto dto) {
        userService.updateUserAdmin(admin.getId(), id, dto);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<?> deleteUserAdmin(@AuthenticationPrincipal CustomUserDetails admin, @PathVariable Long id) {
        userService.deleteUserAdmin(admin.getId(), id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
