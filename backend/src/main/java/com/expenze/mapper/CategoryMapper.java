package com.expenze.mapper;

import com.expenze.dto.CategoryDto;
import com.expenze.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryDto toDto(Category category) {
        if (category == null)
            return null;
        return CategoryDto.builder()
                .id(category.getId())
                .userId(category.getUserId())
                .name(category.getName())
                .sortOrder(category.getSortOrder())
                .isActive(category.getIsActive())
                .icon(category.getIcon())
                .build();
    }

    public Category toEntity(CategoryDto dto) {
        if (dto == null)
            return null;
        return Category.builder()
                .id(dto.getId())
                .userId(dto.getUserId())
                .name(dto.getName())
                .sortOrder(dto.getSortOrder())
                .isActive(dto.getIsActive())
                .icon(dto.getIcon())
                .build();
    }
}
