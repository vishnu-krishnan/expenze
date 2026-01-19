package com.expenze.controller;

import com.expenze.dto.CategoryTemplateDto;
import com.expenze.security.CustomUserDetails;
import com.expenze.service.CategoryTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/category-templates")
@RequiredArgsConstructor
public class CategoryTemplateController {

    private final CategoryTemplateService templateService;

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<CategoryTemplateDto>> getTemplatesByCategory(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long categoryId) {
        log.debug("GET /category-templates/category/{} - User: {}", categoryId, user.getId());
        return ResponseEntity.ok(templateService.getTemplatesByCategory(user.getId(), categoryId));
    }

    @GetMapping
    public ResponseEntity<Map<Long, List<CategoryTemplateDto>>> getAllTemplates(
            @AuthenticationPrincipal CustomUserDetails user) {
        log.debug("GET /category-templates - User: {}", user.getId());
        return ResponseEntity.ok(templateService.getAllTemplatesGrouped(user.getId()));
    }

    @PostMapping
    public ResponseEntity<CategoryTemplateDto> addTemplate(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody CategoryTemplateDto dto) {
        log.debug("POST /category-templates - User: {}", user.getId());
        return ResponseEntity.ok(templateService.addTemplate(user.getId(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryTemplateDto> updateTemplate(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id,
            @RequestBody CategoryTemplateDto dto) {
        log.debug("PUT /category-templates/{} - User: {}", id, user.getId());
        return ResponseEntity.ok(templateService.updateTemplate(user.getId(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTemplate(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id) {
        log.debug("DELETE /category-templates/{} - User: {}", id, user.getId());
        templateService.deleteTemplate(user.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Template deleted successfully"));
    }

    @PostMapping("/initialize")
    public ResponseEntity<?> initializeDefaults(
            @AuthenticationPrincipal CustomUserDetails user) {
        log.debug("POST /category-templates/initialize - User: {}", user.getId());
        templateService.initializeDefaultTemplates(user.getId());
        return ResponseEntity.ok(Map.of("message", "Default templates initialized"));
    }
}
