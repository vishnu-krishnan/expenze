package com.expenze.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "month_plans", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "monthkey" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "monthkey", nullable = false)
    private String monthKey; // YYYY-MM

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
