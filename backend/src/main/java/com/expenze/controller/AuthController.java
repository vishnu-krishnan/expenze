package com.expenze.controller;

import com.expenze.dto.LoginRequest;
import com.expenze.dto.RegisterRequest;
import com.expenze.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.initRegistration(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP required"));
        }
        return ResponseEntity.ok(authService.completeRegistration(email, otp));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Email required"));
        return ResponseEntity.ok(authService.resendOtp(email));
    }

    @GetMapping("/registration-status/{email}")
    public ResponseEntity<?> getRegistrationStatus(@PathVariable String email) {
        return ResponseEntity.ok(authService.getRegistrationStatus(email));
    }
}
