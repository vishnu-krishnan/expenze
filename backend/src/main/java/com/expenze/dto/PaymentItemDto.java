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
public class PaymentItemDto {
    private Long id;
    private Long userId;
    private Long monthPlanId;
    private Long categoryId;
    private String categoryName; // Enriched
    private String name;
    private BigDecimal plannedAmount;
    private BigDecimal actualAmount;
    private Integer isPaid;
    private String notes;
    private String priority; // HIGH, MEDIUM, LOW
}
