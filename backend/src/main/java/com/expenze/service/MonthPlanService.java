package com.expenze.service;

import com.expenze.dto.MonthPlanDto;
import com.expenze.dto.PaymentItemDto;
import java.util.List;

public interface MonthPlanService {
    MonthPlanDto getMonthPlan(Long userId, String monthKey);

    Long generateMonthPlan(Long userId, String monthKey);

    Long addManualItem(Long userId, PaymentItemDto dto);

    void updateItem(Long userId, Long itemId, PaymentItemDto dto);

    void deleteItem(Long userId, Long itemId);

    // Summaries
    List<Object> getLast6MonthsSummary(Long userId);

    List<Object> getCategoryExpenses(Long userId, String monthKey);

    Object getSalary(Long userId, String monthKey);

    void saveSalary(Long userId, String monthKey, java.math.BigDecimal amount);
}
