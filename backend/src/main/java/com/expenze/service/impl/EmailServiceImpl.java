package com.expenze.service.impl;

import com.expenze.service.EmailService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    // Need access to system settings to configure mailer.
    // Circular dependency risk if UserService depends on EmailService?
    // Auth -> Email. User -> Email. Email -> User (for settings).
    // Better: EmailService depends on SystemSettingRepository directly.

    @Override
    public void sendOtpEmail(String to, String otp, String username, int timeoutMinutes) {
        // Placeholder for legacy logic:
        // 1. Fetch settings (smtp_host, user, pass, provider)
        // 2. Configure JavaMailSender
        // 3. Send email

        // For now, let's log it.
        log.info("MOCK EMAIL SENT to {}: OTP={}, Timeout={}m", to, otp, timeoutMinutes);

        // Use System.out for visibility during dev
        System.out.println("---------------------------------------------------");
        System.out.println("OTP for " + username + " (" + to + "): " + otp);
        System.out.println("---------------------------------------------------");
    }
}
