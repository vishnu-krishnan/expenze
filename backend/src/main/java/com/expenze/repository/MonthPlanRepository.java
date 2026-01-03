package com.expenze.repository;

import com.expenze.entity.MonthPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MonthPlanRepository extends JpaRepository<MonthPlan, Long> {
    Optional<MonthPlan> findByUserIdAndMonthKey(Long userId, String monthKey);
}
