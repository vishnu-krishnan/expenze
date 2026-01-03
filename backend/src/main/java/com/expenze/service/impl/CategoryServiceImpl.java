package com.expenze.service.impl;

import com.expenze.dto.CategoryDto;
import com.expenze.entity.Category;
import com.expenze.mapper.CategoryMapper;
import com.expenze.repository.CategoryRepository;
import com.expenze.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public List<CategoryDto> getCategories(Long userId) {
        return categoryRepository.findByUserIdOrderBySortOrderAscNameAsc(userId).stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Long createCategory(Long userId, CategoryDto dto) {
        dto.setUserId(userId);
        if (dto.getIsActive() == null)
            dto.setIsActive(1);
        if (dto.getSortOrder() == null)
            dto.setSortOrder(0);

        Category category = categoryMapper.toEntity(dto);
        category = categoryRepository.save(category);
        return category.getId();
    }

    @Override
    @Transactional
    public void updateCategory(Long userId, Long categoryId, CategoryDto dto) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        category.setName(dto.getName());
        category.setSortOrder(dto.getSortOrder());
        category.setIsActive(dto.getIsActive());
        category.setIcon(dto.getIcon());

        categoryRepository.save(category);
    }

    @Override
    @Transactional
    public void deleteCategory(Long userId, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        categoryRepository.delete(category);
    }
}
