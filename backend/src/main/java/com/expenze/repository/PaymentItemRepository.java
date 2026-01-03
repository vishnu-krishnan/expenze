package com.expenze.repository;

import com.expenze.entity.PaymentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentItemRepository extends JpaRepository<PaymentItem, Long> {
    List<PaymentItem> findByMonthPlanId(Long monthPlanId);

    List<PaymentItem> findByUserIdAndMonthPlanId(Long userId, Long monthPlanId);

    @Query("SELECT pi FROM PaymentItem pi " +
            "JOIN Category c ON pi.categoryId = c.id " +
            "WHERE pi.monthPlanId = :monthPlanId AND pi.userId = :userId " +
            "ORDER BY c.sortOrder ASC, pi.name ASC")
    List<PaymentItem> findAllByMonthPlanIdWithCategoryOrder(Long monthPlanId, Long userId);

    Optional<PaymentItem> findByMonthPlanIdAndNameAndCategoryIdAndUserId(Long monthPlanId, String name, Long categoryId,
            Long userId);
}
