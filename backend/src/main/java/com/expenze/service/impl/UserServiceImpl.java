package com.expenze.service.impl;

import com.expenze.dto.SystemSettingDto;
import com.expenze.dto.UserDto;
import com.expenze.entity.EmailChangeRequest;
import com.expenze.entity.SystemSetting;
import com.expenze.entity.User;
import com.expenze.mapper.SystemSettingMapper;
import com.expenze.mapper.UserMapper;
import com.expenze.repository.EmailChangeRequestRepository; // Need to create this
import com.expenze.repository.SystemSettingRepository;
import com.expenze.repository.UserRepository;
import com.expenze.service.EmailService;
import com.expenze.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private EmailChangeRequestRepository emailChangeRequestRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private SystemSettingMapper systemSettingMapper;

    @Autowired
    private EmailService emailService;

    @Override
    public UserDto getProfile(Long userId) {
        return userRepository.findById(userId).map(userMapper::toDto).orElse(null);
    }

    @Override
    @Transactional
    public void updateProfile(Long userId, UserDto dto) {
        log.info("Updating profile for user ID: {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPhone(dto.getPhone());
        user.setDefaultBudget(dto.getDefaultBudget());
        // Email update is separate
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void requestEmailChange(Long userId, String newEmail) {
        User user = userRepository.findById(userId).orElseThrow();
        if (newEmail.equals(user.getEmail()))
            throw new RuntimeException("New email same as current");
        if (userRepository.existsByEmail(newEmail))
            throw new RuntimeException("Email already taken");

        String otp = String.format("%06d", new Random().nextInt(999999));
        int timeout = 2; // config later
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(timeout);

        // Delete old requests
        emailChangeRequestRepository.deleteByUserId(userId);

        EmailChangeRequest req = EmailChangeRequest.builder()
                .userId(userId)
                .newEmail(newEmail)
                .otp(otp)
                .expiresAt(expiresAt)
                .build();
        emailChangeRequestRepository.save(req);

        emailService.sendOtpEmail(newEmail, otp, user.getUsername(), timeout);
    }

    @Override
    @Transactional
    public void verifyEmailChange(Long userId, String otp) {
        EmailChangeRequest req = emailChangeRequestRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No pending request"));

        if (req.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new RuntimeException("Expired");
        if (!req.getOtp().equals(otp))
            throw new RuntimeException("Invalid OTP");

        if (userRepository.existsByEmail(req.getNewEmail()))
            throw new RuntimeException("Email taken");

        User user = userRepository.findById(userId).orElseThrow();
        user.setEmail(req.getNewEmail());
        userRepository.save(user);

        emailChangeRequestRepository.delete(req);
    }

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(userMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateUserAdmin(Long adminId, Long targetUserId, UserDto dto) {
        User user = userRepository.findById(targetUserId).orElseThrow();
        user.setRole(dto.getRole());
        user.setIsVerified(dto.getIsVerified());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUserAdmin(Long adminId, Long targetUserId) {
        if (adminId.equals(targetUserId))
            throw new RuntimeException("Cannot delete self");
        userRepository.deleteById(targetUserId);
    }

    @Override
    public List<SystemSettingDto> getAllSettings() {
        return systemSettingRepository.findAll().stream()
                .map(systemSettingMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public SystemSettingDto getSetting(String key) {
        return systemSettingRepository.findBySettingKey(key)
                .map(systemSettingMapper::toDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public void updateSetting(String key, SystemSettingDto dto) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElse(SystemSetting.builder().settingKey(key).category("general").build());

        setting.setSettingValue(dto.getSettingValue());
        if (dto.getSettingType() != null)
            setting.setSettingType(dto.getSettingType());
        if (dto.getDescription() != null)
            setting.setDescription(dto.getDescription());
        if (dto.getCategory() != null)
            setting.setCategory(dto.getCategory());

        systemSettingRepository.save(setting);
    }
}
