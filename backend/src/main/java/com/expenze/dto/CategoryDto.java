package com.expenze.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryDto {
    private Long id;
    private Long userId;
    private String name;
    private Integer sortOrder;
    private Integer isActive;
    private String icon;
}
