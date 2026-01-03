package com.expenze.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;

@Entity
@Table(name = "regular_payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegularPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "userId")
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(name = "categoryId")
    private Long categoryId;

    @Column(name = "defaultPlannedAmount")
    @Builder.Default
    private BigDecimal defaultPlannedAmount = BigDecimal.ZERO;

    private String notes;

    @Column(name = "startMonth")
    private String startMonth; // YYYY-MM

    @Column(name = "endMonth")
    private String endMonth; // YYYY-MM or NULL

    @Builder.Default
    private String frequency = "MONTHLY";

    @Column(name = "isActive")
    @Builder.Default
    private Integer isActive = 1;
}
