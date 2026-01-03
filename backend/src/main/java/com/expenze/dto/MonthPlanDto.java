package com.expenze.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MonthPlanDto {
    private Long id;
    private Long userId;
    private String monthKey;
    private LocalDateTime createdAt;
    private List<PaymentItemDto> items;
}
