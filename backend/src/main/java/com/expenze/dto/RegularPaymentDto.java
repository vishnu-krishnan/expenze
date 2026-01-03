package com.expenze.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegularPaymentDto {
    private Long id;
    private Long userId;
    private String name;
    private Long categoryId;
    private String categoryName; // Enriched
    private BigDecimal defaultPlannedAmount;
    private String notes;
    private String startMonth;
    private String endMonth;
    private String frequency;
    private Integer isActive;
}
