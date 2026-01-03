package com.expenze.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    private LocalDate startDate;
    private LocalDate endDate;
    private String frequency;
    private Integer isActive;
}
