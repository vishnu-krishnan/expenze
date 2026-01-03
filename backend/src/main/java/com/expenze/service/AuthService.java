package com.expenze.service;

import com.expenze.dto.AuthResponse;
import com.expenze.dto.LoginRequest;
import com.expenze.dto.RegisterRequest;
import com.expenze.dto.UserDto;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void verifyOtp(String email, String otp); // Returns token usually, but here verification process creates User?
    // Looking at legacy logic: Register -> verify email -> create user provided in
    // register.
    // Legacy: POST /register sends OTP. POST /verify-otp -> Creates User.
    // So "RegisterRequest" is phase 1.
    // Let's mimic: register(request) -> sends OTP. verifyOtp(email, otp) -> Creates
    // User & Returns Token.

    Object initRegistration(RegisterRequest request); // Returns message/email

    AuthResponse completeRegistration(String email, String otp);

    Object resendOtp(String email);

    Object getRegistrationStatus(String email);
}
