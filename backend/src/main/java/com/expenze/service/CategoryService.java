package com.expenze.service;

import com.expenze.dto.CategoryDto;
import java.util.List;

public interface CategoryService {
    List<CategoryDto> getCategories(Long userId);

    Long createCategory(Long userId, CategoryDto categoryDto);

    void updateCategory(Long userId, Long categoryId, CategoryDto categoryDto);

    void deleteCategory(Long userId, Long categoryId);
}
