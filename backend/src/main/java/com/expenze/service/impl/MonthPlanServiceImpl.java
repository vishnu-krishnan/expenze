package com.expenze.service.impl;

import com.expenze.dto.MonthPlanDto;
import com.expenze.dto.PaymentItemDto;
import com.expenze.entity.*;
import com.expenze.mapper.PaymentItemMapper;
import com.expenze.repository.*;
import com.expenze.service.MonthPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MonthPlanServiceImpl implements MonthPlanService {

    private final MonthPlanRepository monthPlanRepository;
    private final PaymentItemRepository paymentItemRepository;
    private final RegularPaymentRepository regularPaymentRepository;
    private final SalaryRepository salaryRepository;
    private final PaymentItemMapper paymentItemMapper;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public MonthPlanDto getMonthPlan(Long userId, String monthKey) {
        // Always ensure plan exists and is populated with regular payments
        generateMonthPlan(userId, monthKey);

        MonthPlan plan = monthPlanRepository.findByUserIdAndMonthKey(userId, monthKey)
                .orElseThrow(() -> new RuntimeException("Failed to generate plan"));

        List<PaymentItem> items = paymentItemRepository.findAllByMonthPlanIdWithCategoryOrder(plan.getId(), userId);

        // Map Categories
        Map<Long, String> catMap = categoryRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));

        List<PaymentItemDto> itemDtos = items.stream().map(i -> {
            PaymentItemDto dto = paymentItemMapper.toDto(i);
            dto.setCategoryName(catMap.get(i.getCategoryId()));
            return dto;
        }).collect(Collectors.toList());

        return MonthPlanDto.builder()
                .id(plan.getId())
                .userId(plan.getUserId())
                .monthKey(plan.getMonthKey())
                .createdAt(plan.getCreatedAt())
                .items(itemDtos)
                .build();
    }

    @Override
    @Transactional
    public Long generateMonthPlan(Long userId, String monthKey) {
        log.info("Generating month plan for user: {} month: {}", userId, monthKey);
        // 1. Ensure Plan
        MonthPlan plan = monthPlanRepository.findByUserIdAndMonthKey(userId, monthKey)
                .orElseGet(
                        () -> monthPlanRepository.save(MonthPlan.builder().userId(userId).monthKey(monthKey).build()));

        // 2. Fetch Active Regular Payments
        // Logic: active in [periodStart, periodEnd]
        YearMonth ym = YearMonth.parse(monthKey);
        LocalDate periodStart = ym.atDay(1);
        LocalDate periodEnd = ym.atEndOfMonth();

        List<RegularPayment> regularPayments = regularPaymentRepository.findActiveForMonth(userId, periodStart,
                periodEnd);
        log.debug("Found {} active regular payments for user {}", regularPayments.size(), userId);

        for (RegularPayment rp : regularPayments) {
            Optional<PaymentItem> existing = paymentItemRepository.findByMonthPlanIdAndNameAndCategoryIdAndUserId(
                    plan.getId(), rp.getName(), rp.getCategoryId(), userId);

            if (existing.isEmpty()) {
                PaymentItem item = PaymentItem.builder()
                        .userId(userId)
                        .monthPlanId(plan.getId())
                        .categoryId(rp.getCategoryId())
                        .name(rp.getName())
                        .plannedAmount(rp.getDefaultPlannedAmount())
                        .build();
                paymentItemRepository.save(item);
                log.trace("Created payment item from regular payment: {}", rp.getName());
            }
        }
        paymentItemRepository.flush();
        return plan.getId();
    }

    @Override
    @Transactional
    public Long addManualItem(Long userId, PaymentItemDto dto) {
        dto.setUserId(userId);
        PaymentItem item = paymentItemMapper.toEntity(dto);
        item = paymentItemRepository.save(item);
        return item.getId();
    }

    @Override
    @Transactional
    public void updateItem(Long userId, Long itemId, PaymentItemDto dto) {
        PaymentItem item = paymentItemRepository.findById(itemId).orElseThrow();
        if (!item.getUserId().equals(userId))
            throw new RuntimeException("Unauthorized");

        item.setName(dto.getName());
        item.setPlannedAmount(dto.getPlannedAmount());
        item.setActualAmount(dto.getActualAmount());
        item.setIsPaid(dto.getIsPaid());
        item.setNotes(dto.getNotes());
        item.setPriority(dto.getPriority());

        paymentItemRepository.save(item);
    }

    @Override
    @Transactional
    public void deleteItem(Long userId, Long itemId) {
        PaymentItem item = paymentItemRepository.findById(itemId).orElseThrow();
        if (!item.getUserId().equals(userId))
            throw new RuntimeException("Unauthorized");
        paymentItemRepository.delete(item);
    }

    @Override
    public List<Object> getLast6MonthsSummary(Long userId) {
        YearMonth current = YearMonth.now();
        List<Map<String, Object>> result = new ArrayList<>();

        // Last 6 months inclusive
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            String key = ym.toString(); // YYYY-MM

            MonthPlan plan = monthPlanRepository.findByUserIdAndMonthKey(userId, key).orElse(null);
            BigDecimal totalPlanned = BigDecimal.ZERO;
            BigDecimal totalActual = BigDecimal.ZERO;

            if (plan != null) {
                List<PaymentItem> items = paymentItemRepository.findByUserIdAndMonthPlanId(userId, plan.getId());
                for (PaymentItem pi : items) {
                    if (pi.getPlannedAmount() != null)
                        totalPlanned = totalPlanned.add(pi.getPlannedAmount());
                    if (pi.getActualAmount() != null)
                        totalActual = totalActual.add(pi.getActualAmount());
                }
            }

            Map<String, Object> map = new HashMap<>();
            map.put("monthKey", key);
            map.put("totalPlanned", totalPlanned);
            map.put("totalActual", totalActual);
            result.add(map);
        }
        return new ArrayList<>(result);
    }

    @Override
    public List<Object> getCategoryExpenses(Long userId, String monthKey) {
        MonthPlan plan = monthPlanRepository.findByUserIdAndMonthKey(userId, monthKey).orElse(null);
        if (plan == null)
            return Collections.emptyList();

        List<PaymentItem> items = paymentItemRepository.findByUserIdAndMonthPlanId(userId, plan.getId());

        // Group by Category -> Sum Actual
        Map<Long, BigDecimal> sums = new HashMap<>();
        for (PaymentItem pi : items) {
            if (pi.getActualAmount() == null || pi.getActualAmount().compareTo(BigDecimal.ZERO) <= 0)
                continue;
            sums.merge(pi.getCategoryId(), pi.getActualAmount(), BigDecimal::add);
        }

        List<Object> result = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : sums.entrySet()) {
            Category cat = categoryRepository.findById(entry.getKey()).orElse(null);
            String name = (cat != null) ? cat.getName() : "Unknown";

            Map<String, Object> map = new HashMap<>();
            map.put("categoryName", name);
            map.put("totalActual", entry.getValue());
            result.add(map);
        }

        // Sort descending
        result.sort((a, b) -> {
            BigDecimal v1 = (BigDecimal) ((Map) a).get("totalActual");
            BigDecimal v2 = (BigDecimal) ((Map) b).get("totalActual");
            return v2.compareTo(v1);
        });

        return result;
    }

    @Override
    public Object getSalary(Long userId, String monthKey) {
        Salary s = salaryRepository.findByUserIdAndMonthKey(userId, monthKey).orElse(null);
        Map<String, Object> map = new HashMap<>();
        map.put("monthKey", monthKey);
        map.put("amount", s != null ? s.getAmount() : BigDecimal.ZERO);
        return map;
    }

    @Override
    @Transactional
    public void saveSalary(Long userId, String monthKey, BigDecimal amount) {
        Salary s = salaryRepository.findByUserIdAndMonthKey(userId, monthKey)
                .orElse(Salary.builder().userId(userId).monthKey(monthKey).build());
        s.setAmount(amount);
        salaryRepository.save(s);
    }
}
