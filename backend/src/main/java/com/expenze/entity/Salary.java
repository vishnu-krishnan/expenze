package com.expenze.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "salaries", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "userId", "monthKey" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Salary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "month_key", nullable = false)
    private String monthKey; // YYYY-MM

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
