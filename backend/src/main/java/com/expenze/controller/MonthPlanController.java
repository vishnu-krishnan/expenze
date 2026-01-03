package com.expenze.controller;

import com.expenze.dto.MonthPlanDto;
import com.expenze.dto.PaymentItemDto;
import com.expenze.security.CustomUserDetails;
import com.expenze.service.MonthPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MonthPlanController {

    private final MonthPlanService monthPlanService;

    @GetMapping("/month/{key}")
    public ResponseEntity<?> getMonthPlan(@AuthenticationPrincipal CustomUserDetails user, @PathVariable String key) {
        log.debug("GET /month/{} - User ID: {}", key, user.getId());
        try {
            MonthPlanDto plan = monthPlanService.getMonthPlan(user.getId(), key);
            log.debug("Found plan for month {}: {}", key, plan != null);
            return ResponseEntity.ok(plan);
        } catch (Exception e) {
            log.error("Error getting month plan for {}: {}", key, e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/month/generate")
    public ResponseEntity<?> generate(@AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, String> payload) {
        String monthKey = payload.get("monthKey");
        Long planId = monthPlanService.generateMonthPlan(user.getId(), monthKey);
        // Note: Logic in Service handles 'already exists' gracefully or we need to
        // check return.
        // Legacy: returns { message: ..., planId: ... }
        return ResponseEntity.ok(Map.of("planId", planId, "message", "Generated items for " + monthKey));
    }

    @PostMapping("/items")
    public ResponseEntity<?> addManualItem(@AuthenticationPrincipal CustomUserDetails user,
            @RequestBody PaymentItemDto dto) {
        Long id = monthPlanService.addManualItem(user.getId(), dto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<?> updateItem(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long id,
            @RequestBody PaymentItemDto dto) {
        monthPlanService.updateItem(user.getId(), id, dto);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteItem(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long id) {
        monthPlanService.deleteItem(user.getId(), id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/summary/last6")
    public ResponseEntity<?> getLast6Months(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(monthPlanService.getLast6MonthsSummary(user.getId()));
    }

    @GetMapping("/category-expenses/{monthKey}")
    public ResponseEntity<?> getCategoryExpenses(@AuthenticationPrincipal CustomUserDetails user,
            @PathVariable String monthKey) {
        return ResponseEntity.ok(monthPlanService.getCategoryExpenses(user.getId(), monthKey));
    }

    @GetMapping("/salary/{monthKey}")
    public ResponseEntity<?> getSalary(@AuthenticationPrincipal CustomUserDetails user, @PathVariable String monthKey) {
        return ResponseEntity.ok(monthPlanService.getSalary(user.getId(), monthKey));
    }

    @PostMapping("/salary")
    public ResponseEntity<?> saveSalary(@AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, Object> payload) {
        String monthKey = (String) payload.get("monthKey");
        // Handle number safely
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        monthPlanService.saveSalary(user.getId(), monthKey, amount);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
