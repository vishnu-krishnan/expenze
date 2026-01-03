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

    @Column(name = "userId")
    private Long userId;

    @Column(name = "monthPlanId")
    private Long monthPlanId;

    @Column(name = "categoryId")
    private Long categoryId;

    @Column(nullable = false)
    private String name;

    @Column(name = "plannedAmount")
    @Builder.Default
    private BigDecimal plannedAmount = BigDecimal.ZERO;

    @Column(name = "actualAmount")
    @Builder.Default
    private BigDecimal actualAmount = BigDecimal.ZERO;

    @Column(name = "isPaid")
    @Builder.Default
    private Integer isPaid = 0;

    private String notes;
}
