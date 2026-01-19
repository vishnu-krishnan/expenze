package com.expenze.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;

@Entity
@Table(name = "payment_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "month_plan_id")
    private Long monthPlanId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(nullable = false)
    private String name;

    @Column(name = "planned_amount")
    @Builder.Default
    private BigDecimal plannedAmount = BigDecimal.ZERO;

    @Column(name = "actual_amount")
    @Builder.Default
    private BigDecimal actualAmount = BigDecimal.ZERO;

    @Column(name = "is_paid")
    @Builder.Default
    private Integer isPaid = 0;

    private String notes;

    @Column(name = "priority")
    @Builder.Default
    private String priority = "MEDIUM"; // HIGH, MEDIUM, LOW
}
