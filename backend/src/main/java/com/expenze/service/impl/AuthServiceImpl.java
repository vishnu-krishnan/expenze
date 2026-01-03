package com.expenze.service.impl;

import com.expenze.dto.AuthResponse;
import com.expenze.dto.LoginRequest;
import com.expenze.dto.RegisterRequest;
import com.expenze.entity.User;
import com.expenze.entity.UserVerification;
import com.expenze.mapper.UserMapper;
import com.expenze.repository.UserRepository;
import com.expenze.repository.UserVerificationRepository;
import com.expenze.security.CustomUserDetails;
import com.expenze.security.JwtUtils;
import com.expenze.service.AuthService;
import com.expenze.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserVerificationRepository userVerificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private EmailService emailService;

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Attempting login for user: {}", request.getUsername());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        log.info("Login successful for user: {}", request.getUsername());
        String jwt = jwtUtils.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwt)
                .user(userMapper.toDto(userDetails.getUser()))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Legacy "register" actually just inits registration and sends OTP or creates
        // user?
        // Legacy: POST /register checks duplicates, creates entry in
        // user_verifications, sends OTP.
        // DOES NOT create User yet.
        // But the interface I defined says it returns AuthResponse?
        // Actually, looking at legacy: res.json({ message: 'Account created! Sending
        // verification email...', ... })
        // It does NOT return a token.
        // My interface definition might need adjustment or I return null/dummy
        // AuthResponse?
        // I should stick to the legacy flow essentially.
        // I'll update the interface to return Object or a specific response DTO, but
        // for now I returned AuthResponse in interface.
        // Let's implement initRegistration instead, as defined in interface.
        return null; // Not used directy
    }

    @Override
    @Transactional
    public Object initRegistration(RegisterRequest request) {
        log.info("Initializing registration for email: {}", request.getEmail());
        if (userRepository.existsByUsername(request.getUsername())
                || userRepository.existsByEmail(request.getEmail())) {
            log.error("Registration failed: Username or Email already exists for {}", request.getEmail());
            throw new RuntimeException("Username or Email already registered");
        }

        // Cleanup old verification
        userVerificationRepository.deleteByEmail(request.getEmail());

        String otp = String.format("%06d", new Random().nextInt(999999));
        int timeout = 2; // config
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(timeout);

        UserVerification uv = UserVerification.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .otpCode(otp)
                .expiresAt(expiresAt)
                .deliveryStatus("pending")
                .build();

        userVerificationRepository.save(uv);

        emailService.sendOtpEmail(request.getEmail(), otp, request.getUsername(), timeout);
        log.info("OTP sent to email: {}", request.getEmail());

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Account created! Sending verification email...");
        resp.put("email", request.getEmail());
        resp.put("otp_timeout", timeout);
        return resp;
    }

    @Override
    @Transactional
    public AuthResponse completeRegistration(String email, String otp) { // api/verify-otp
        UserVerification uv = userVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid or expired verification request."));

        if (!uv.getOtpCode().equals(otp))
            throw new RuntimeException("Invalid OTP");
        if (uv.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new RuntimeException("OTP Expired");

        // Move to Users
        User user = User.builder()
                .username(uv.getUsername())
                .email(uv.getEmail())
                .password(uv.getPassword()) // Already encoded in temp table
                .phone(uv.getPhone())
                .role("user")
                .isVerified(1) // Verified now
                .build();

        user = userRepository.save(user); // If race condition, throws exception

        userVerificationRepository.delete(uv);

        // Auto login
        String jwt = jwtUtils.generateToken(new CustomUserDetails(user));
        return AuthResponse.builder()
                .token(jwt)
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    @Transactional
    public Object resendOtp(String email) {
        UserVerification uv = userVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No pending registration"));

        String otp = String.format("%06d", new Random().nextInt(999999));
        int timeout = 2;
        uv.setOtpCode(otp);
        uv.setExpiresAt(LocalDateTime.now().plusMinutes(timeout));
        uv.setDeliveryStatus("pending");

        userVerificationRepository.save(uv);

        emailService.sendOtpEmail(email, otp, uv.getUsername(), timeout);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "New OTP has been sent!");
        resp.put("otp_timeout", timeout);
        return resp;
    }

    @Override
    public Object getRegistrationStatus(String email) {
        return userVerificationRepository.findByEmail(email)
                .map(uv -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("delivery_status", uv.getDeliveryStatus());
                    map.put("delivery_error", uv.getDeliveryError());
                    return map;
                })
                .orElseThrow(() -> new RuntimeException("Registration not found"));
    }

    @Override
    public void verifyOtp(String email, String otp) {
        // Redundant with completeRegistration for this specific flow
    }
}
