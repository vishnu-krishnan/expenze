package com.expenze.service.impl;

import com.expenze.dto.CategoryTemplateDto;
import com.expenze.entity.Category;
import com.expenze.entity.CategoryTemplate;
import com.expenze.exception.BadRequestException;
import com.expenze.exception.ResourceNotFoundException;
import com.expenze.exception.UnauthorizedException;
import com.expenze.repository.CategoryRepository;
import com.expenze.repository.CategoryTemplateRepository;
import com.expenze.service.CategoryTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryTemplateServiceImpl implements CategoryTemplateService {

    private final CategoryTemplateRepository templateRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryTemplateDto> getTemplatesByCategory(Long userId, Long categoryId) {
        try {
            log.debug("Fetching templates for user: {} and category: {}", userId, categoryId);

            // Validate category exists and belongs to user
            validateCategoryOwnership(userId, categoryId);

            List<CategoryTemplate> templates = templateRepository
                    .findByUserIdAndCategoryIdAndIsActiveOrderBySortOrderAsc(userId, categoryId, 1);

            log.debug("Found {} templates for category: {}", templates.size(), categoryId);
            return templates.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        } catch (ResourceNotFoundException | UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching templates for category {}: {}", categoryId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch category templates", e);
        }
    }

    @Override
    public Map<Long, List<CategoryTemplateDto>> getAllTemplatesGrouped(Long userId) {
        try {
            log.debug("Fetching all templates for user: {}", userId);

            if (userId == null) {
                throw new BadRequestException("User ID cannot be null");
            }

            List<CategoryTemplate> templates = templateRepository
                    .findByUserIdAndIsActiveOrderBySortOrderAsc(userId, 1);

            log.debug("Found {} total templates for user: {}", templates.size(), userId);

            return templates.stream()
                    .map(this::toDto)
                    .collect(Collectors.groupingBy(CategoryTemplateDto::getCategoryId));
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching all templates for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch templates", e);
        }
    }

    @Override
    @Transactional
    public CategoryTemplateDto addTemplate(Long userId, CategoryTemplateDto dto) {
        try {
            log.debug("Adding template for user: {}, category: {}", userId, dto.getCategoryId());

            // Validation
            validateTemplateDto(dto);
            validateCategoryOwnership(userId, dto.getCategoryId());

            // Check for duplicates
            List<CategoryTemplate> existing = templateRepository
                    .findByUserIdAndCategoryIdAndIsActiveOrderBySortOrderAsc(
                            userId, dto.getCategoryId(), 1);

            boolean isDuplicate = existing.stream()
                    .anyMatch(t -> t.getSubOption().equalsIgnoreCase(dto.getSubOption().trim()));

            if (isDuplicate) {
                throw new BadRequestException(
                        "Template '" + dto.getSubOption() + "' already exists for this category");
            }

            CategoryTemplate template = CategoryTemplate.builder()
                    .userId(userId)
                    .categoryId(dto.getCategoryId())
                    .subOption(dto.getSubOption().trim())
                    .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : existing.size())
                    .isActive(1)
                    .build();

            template = templateRepository.save(template);
            log.info("Created category template: {} for user: {}", template.getId(), userId);

            return toDto(template);
        } catch (BadRequestException | ResourceNotFoundException | UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error adding template: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add template", e);
        }
    }

    @Override
    @Transactional
    public CategoryTemplateDto updateTemplate(Long userId, Long id, CategoryTemplateDto dto) {
        try {
            log.debug("Updating template: {} for user: {}", id, userId);

            if (id == null) {
                throw new BadRequestException("Template ID cannot be null");
            }

            if (dto.getSubOption() == null || dto.getSubOption().trim().isEmpty()) {
                throw new BadRequestException("Sub-option cannot be empty");
            }

            CategoryTemplate template = templateRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Template", "id", id));

            // Verify ownership
            if (!template.getUserId().equals(userId)) {
                log.warn("User {} attempted to update template {} owned by user {}",
                        userId, id, template.getUserId());
                throw new UnauthorizedException("You don't have permission to update this template");
            }

            // Check for duplicates (excluding current template)
            List<CategoryTemplate> existing = templateRepository
                    .findByUserIdAndCategoryIdAndIsActiveOrderBySortOrderAsc(
                            userId, template.getCategoryId(), 1);

            boolean isDuplicate = existing.stream()
                    .filter(t -> !t.getId().equals(id))
                    .anyMatch(t -> t.getSubOption().equalsIgnoreCase(dto.getSubOption().trim()));

            if (isDuplicate) {
                throw new BadRequestException(
                        "Template '" + dto.getSubOption() + "' already exists for this category");
            }

            template.setSubOption(dto.getSubOption().trim());
            if (dto.getSortOrder() != null) {
                template.setSortOrder(dto.getSortOrder());
            }

            template = templateRepository.save(template);
            log.info("Updated category template: {}", id);

            return toDto(template);
        } catch (BadRequestException | ResourceNotFoundException | UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating template {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to update template", e);
        }
    }

    @Override
    @Transactional
    public void deleteTemplate(Long userId, Long id) {
        try {
            log.debug("Deleting template: {} for user: {}", id, userId);

            if (id == null) {
                throw new BadRequestException("Template ID cannot be null");
            }

            CategoryTemplate template = templateRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Template", "id", id));

            // Verify ownership
            if (!template.getUserId().equals(userId)) {
                log.warn("User {} attempted to delete template {} owned by user {}",
                        userId, id, template.getUserId());
                throw new UnauthorizedException("You don't have permission to delete this template");
            }

            template.setIsActive(0);
            templateRepository.save(template);
            log.info("Deleted category template: {}", id);
        } catch (BadRequestException | ResourceNotFoundException | UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting template {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete template", e);
        }
    }

    @Override
    @Transactional
    public void initializeDefaultTemplates(Long userId) {
        try {
            log.info("Initializing default templates for user: {}", userId);

            if (userId == null) {
                throw new BadRequestException("User ID cannot be null");
            }

            // Get user's existing categories
            List<Category> userCategories = categoryRepository.findByUserId(userId);
            Map<String, Category> categoryNameMap = userCategories.stream()
                    .collect(Collectors.toMap(Category::getName, c -> c, (a, b) -> a));

            // Default categories with their icons
            Map<String, String> defaultCategoryIcons = new LinkedHashMap<>();
            defaultCategoryIcons.put("Fuel", "⛽");
            defaultCategoryIcons.put("Groceries", "🛒");
            defaultCategoryIcons.put("Utilities", "💡");
            defaultCategoryIcons.put("Transport", "🚲");
            defaultCategoryIcons.put("Food", "🍽️");
            defaultCategoryIcons.put("Shopping", "🛍️");
            defaultCategoryIcons.put("Healthcare", "🏥");
            defaultCategoryIcons.put("Entertainment", "🎭");

            // Ensure categories exist
            int categoriesCreated = 0;
            int sortOrder = userCategories.size();
            for (Map.Entry<String, String> entry : defaultCategoryIcons.entrySet()) {
                if (!categoryNameMap.containsKey(entry.getKey())) {
                    Category newCat = Category.builder()
                            .userId(userId)
                            .name(entry.getKey())
                            .icon(entry.getValue())
                            .isActive(1)
                            .sortOrder(sortOrder++)
                            .build();
                    newCat = categoryRepository.save(newCat);
                    categoryNameMap.put(entry.getKey(), newCat);
                    categoriesCreated++;
                    log.debug("Created default category: {} for user: {}", entry.getKey(), userId);
                }
            }

            // Default templates
            Map<String, List<String>> defaultTemplates = getDefaultTemplates();

            int templatesCreated = 0;
            for (Map.Entry<String, List<String>> entry : defaultTemplates.entrySet()) {
                String categoryName = entry.getKey();
                Category category = categoryNameMap.get(categoryName);

                if (category != null) {
                    // Check existing templates for THIS category to avoid duplicates
                    List<CategoryTemplate> existingTemplates = templateRepository
                            .findByUserIdAndCategoryIdAndIsActiveOrderBySortOrderAsc(userId, category.getId(), 1);

                    Set<String> existingOptions = existingTemplates.stream()
                            .map(t -> t.getSubOption().toLowerCase())
                            .collect(Collectors.toSet());

                    int tOrder = existingTemplates.size();
                    for (String subOption : entry.getValue()) {
                        if (!existingOptions.contains(subOption.toLowerCase())) {
                            CategoryTemplate template = CategoryTemplate.builder()
                                    .userId(userId)
                                    .categoryId(category.getId())
                                    .subOption(subOption)
                                    .sortOrder(tOrder++)
                                    .isActive(1)
                                    .build();

                            templateRepository.save(template);
                            templatesCreated++;
                        }
                    }
                }
            }

            log.info("Initialization complete for user {}: Created {} categories and {} templates",
                    userId, categoriesCreated, templatesCreated);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error initializing default templates for user {}: {}",
                    userId, e.getMessage(), e);
            throw new RuntimeException("Failed to initialize default templates", e);
        }
    }

    // Helper methods

    private void validateTemplateDto(CategoryTemplateDto dto) {
        if (dto == null) {
            throw new BadRequestException("Template data cannot be null");
        }
        if (dto.getCategoryId() == null) {
            throw new BadRequestException("Category ID is required");
        }
        if (dto.getSubOption() == null || dto.getSubOption().trim().isEmpty()) {
            throw new BadRequestException("Sub-option cannot be empty");
        }
        if (dto.getSubOption().trim().length() > 100) {
            throw new BadRequestException("Sub-option cannot exceed 100 characters");
        }
    }

    private void validateCategoryOwnership(Long userId, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        if (!category.getUserId().equals(userId)) {
            log.warn("User {} attempted to access category {} owned by user {}",
                    userId, categoryId, category.getUserId());
            throw new UnauthorizedException("You don't have permission to access this category");
        }
    }

    private CategoryTemplateDto toDto(CategoryTemplate entity) {
        if (entity == null) {
            return null;
        }

        CategoryTemplateDto dto = CategoryTemplateDto.builder()
                .id(entity.getId())
                .categoryId(entity.getCategoryId())
                .subOption(entity.getSubOption())
                .sortOrder(entity.getSortOrder())
                .build();

        // Enrich with category name
        try {
            categoryRepository.findById(entity.getCategoryId())
                    .ifPresent(cat -> dto.setCategoryName(cat.getName()));
        } catch (Exception e) {
            log.warn("Could not enrich template {} with category name: {}",
                    entity.getId(), e.getMessage());
        }

        return dto;
    }

    private Map<String, List<String>> getDefaultTemplates() {
        Map<String, List<String>> defaults = new LinkedHashMap<>();

        defaults.put("Fuel", Arrays.asList("Bike", "Car", "Scooter"));
        defaults.put("Groceries", Arrays.asList("Weekly", "Monthly", "Vegetables", "Fruits", "Meat"));
        defaults.put("Utilities", Arrays.asList("Electricity", "Water", "Gas", "Internet", "Phone"));
        defaults.put("Transport", Arrays.asList("Bus", "Train", "Auto", "Cab", "Metro"));
        defaults.put("Food", Arrays.asList("Breakfast", "Lunch", "Dinner", "Snacks"));
        defaults.put("Shopping", Arrays.asList("Clothes", "Electronics", "Home", "Personal Care"));
        defaults.put("Healthcare", Arrays.asList("Medicine", "Doctor", "Lab Tests", "Pharmacy"));
        defaults.put("Entertainment", Arrays.asList("Movies", "Dining Out", "Subscriptions", "Events"));

        return defaults;
    }
}
