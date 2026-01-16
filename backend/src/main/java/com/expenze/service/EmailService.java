package com.expenze.service;

public interface EmailService {
    void sendOtpEmail(String to, String otp, String username, int timeoutMinutes);

    void sendPasswordResetEmail(String to, String link);
}
