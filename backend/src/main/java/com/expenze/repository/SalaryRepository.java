package com.expenze.repository;

import com.expenze.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {
    Optional<Salary> findByUserIdAndMonthKey(Long userId, String monthKey);
}
