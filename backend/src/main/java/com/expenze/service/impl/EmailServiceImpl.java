package com.expenze.service.impl;

import com.expenze.service.EmailService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String senderEmail;

    @Override
    public void sendOtpEmail(String to, String otp, String username, int timeoutMinutes) {
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject("Expenze Verfication OTP");
            message.setText("Dear " + username + ",\n\n" +
                    "Your OTP for verification is: " + otp + "\n" +
                    "This code expires in " + timeoutMinutes + " minutes.\n\n" +
                    "Best Regards,\nExpenze Team");

            javaMailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
            // Fallback logging for debug just in case
            log.info("FALLBACK: OTP for {}: {}", to, otp);
        }
    }
}
