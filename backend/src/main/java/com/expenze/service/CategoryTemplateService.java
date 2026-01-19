package com.expenze.service;

import com.expenze.dto.CategoryTemplateDto;

import java.util.List;
import java.util.Map;

public interface CategoryTemplateService {

    List<CategoryTemplateDto> getTemplatesByCategory(Long userId, Long categoryId);

    Map<Long, List<CategoryTemplateDto>> getAllTemplatesGrouped(Long userId);

    CategoryTemplateDto addTemplate(Long userId, CategoryTemplateDto dto);

    CategoryTemplateDto updateTemplate(Long userId, Long id, CategoryTemplateDto dto);

    void deleteTemplate(Long userId, Long id);

    void initializeDefaultTemplates(Long userId);
}
