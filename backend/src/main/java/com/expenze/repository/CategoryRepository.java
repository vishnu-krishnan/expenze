package com.expenze.repository;

import com.expenze.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIdOrderBySortOrderAsc(Long userId);

    List<Category> findByUserIdOrderBySortOrderAscNameAsc(Long userId);

    List<Category> findByUserId(Long userId);
}
