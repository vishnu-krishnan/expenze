package com.expenze.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryTemplateDto {
    private Long id;
    private Long categoryId;
    private String categoryName; // Enriched from Category
    private String subOption;
    private Integer sortOrder;
}
