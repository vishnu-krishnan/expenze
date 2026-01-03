package com.expenze.controller;

import com.expenze.dto.CategoryDto;
import com.expenze.security.CustomUserDetails;
import com.expenze.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public ResponseEntity<?> getCategories(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(categoryService.getCategories(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> createCategory(@AuthenticationPrincipal CustomUserDetails user,
            @RequestBody CategoryDto dto) {
        Long id = categoryService.createCategory(user.getId(), dto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long id,
            @RequestBody CategoryDto dto) {
        categoryService.updateCategory(user.getId(), id, dto);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long id) {
        categoryService.deleteCategory(user.getId(), id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
