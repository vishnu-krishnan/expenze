package com.expenze.repository;

import com.expenze.entity.CategoryTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryTemplateRepository extends JpaRepository<CategoryTemplate, Long> {

    List<CategoryTemplate> findByUserIdAndIsActiveOrderBySortOrderAsc(Long userId, Integer isActive);

    List<CategoryTemplate> findByUserIdAndCategoryIdAndIsActiveOrderBySortOrderAsc(
            Long userId, Long categoryId, Integer isActive);

    void deleteByIdAndUserId(Long id, Long userId);
}
