package com.expenze.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "userId")
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(name = "sortOrder")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "isActive")
    @Builder.Default
    private Integer isActive = 1;

    private String icon;
}
