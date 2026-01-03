package com.expenze.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String phone;
    private String role;
    private Integer isVerified;
    private BigDecimal defaultBudget;
    private LocalDateTime createdAt;
}
