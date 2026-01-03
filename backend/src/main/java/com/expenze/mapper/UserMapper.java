package com.expenze.mapper;

import com.expenze.dto.UserDto;
import com.expenze.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null)
            return null;
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .isVerified(user.getIsVerified())
                .defaultBudget(user.getDefaultBudget())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
