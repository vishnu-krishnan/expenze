package com.expenze.service;

import com.expenze.dto.SystemSettingDto;
import com.expenze.dto.UserDto;
import java.util.List;

public interface UserService {
    UserDto getProfile(Long userId);

    void updateProfile(Long userId, UserDto dto);

    void requestEmailChange(Long userId, String newEmail);

    void verifyEmailChange(Long userId, String otp);

    // Admin
    List<UserDto> getAllUsers();

    void updateUserAdmin(Long adminId, Long targetUserId, UserDto dto);

    void deleteUserAdmin(Long adminId, Long targetUserId);

    // Settings
    List<SystemSettingDto> getAllSettings();

    SystemSettingDto getSetting(String key);

    void updateSetting(String key, SystemSettingDto dto);
}
