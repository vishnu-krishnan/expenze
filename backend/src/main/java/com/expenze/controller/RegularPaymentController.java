package com.expenze.controller;

import com.expenze.dto.RegularPaymentDto;
import com.expenze.security.CustomUserDetails;
import com.expenze.service.RegularPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/regular")
@RequiredArgsConstructor
public class RegularPaymentController {

    private final RegularPaymentService regularPaymentService;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(regularPaymentService.getAll(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal CustomUserDetails user,
            @RequestBody RegularPaymentDto dto) {
        Long id = regularPaymentService.create(user.getId(), dto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long id,
            @RequestBody RegularPaymentDto dto) {
        regularPaymentService.update(user.getId(), id, dto);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long id) {
        regularPaymentService.delete(user.getId(), id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
