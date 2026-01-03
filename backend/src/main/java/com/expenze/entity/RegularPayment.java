package com.expenze.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

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

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Builder.Default
    private String frequency = "MONTHLY"; // MONTHLY, WEEKLY, YEARLY

    @Column(name = "isActive")
    @Builder.Default
    private Integer isActive = 1;
}
