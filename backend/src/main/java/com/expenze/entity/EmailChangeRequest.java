package com.expenze.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_change_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "userId")
    private Long userId;

    @Column(name = "newEmail", nullable = false)
    private String newEmail;

    @Column(nullable = false)
    private String otp;

    @Column(name = "expiresAt", nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;
}
