package com.expenze.repository;

import com.expenze.entity.RegularPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegularPaymentRepository extends JpaRepository<RegularPayment, Long> {
    List<RegularPayment> findByUserId(Long userId);

    @Query("SELECT r FROM RegularPayment r WHERE r.userId = :userId AND r.isActive = 1 " +
            "AND r.startMonth <= :monthKey AND (r.endMonth IS NULL OR r.endMonth >= :monthKey)")
    List<RegularPayment> findActiveForMonth(Long userId, String monthKey);
}
