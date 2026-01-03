package com.expenze.service.impl;

import com.expenze.dto.RegularPaymentDto;
import com.expenze.entity.Category;
import com.expenze.entity.RegularPayment;
import com.expenze.mapper.RegularPaymentMapper;
import com.expenze.repository.CategoryRepository;
import com.expenze.repository.RegularPaymentRepository;
import com.expenze.service.RegularPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegularPaymentServiceImpl implements RegularPaymentService {

    private final RegularPaymentRepository regularPaymentRepository;
    private final CategoryRepository categoryRepository;
    private final RegularPaymentMapper regularPaymentMapper;

    @Override
    public List<RegularPaymentDto> getAll(Long userId) {
        List<RegularPayment> list = regularPaymentRepository.findByUserId(userId);

        // Fetch categories to map names (N+1 optimization: fetch all categories for
        // user)
        Map<Long, String> categoryMap = categoryRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));

        return list.stream().map(rp -> {
            RegularPaymentDto dto = regularPaymentMapper.toDto(rp);
            dto.setCategoryName(categoryMap.get(rp.getCategoryId()));
            return dto;
        }).collect(Collectors.toList());
        // Note: Sort by Category Name, then Name in memory or via custom query.
        // Legacy sorted by SQL join.
    }

    @Override
    @Transactional
    public Long create(Long userId, RegularPaymentDto dto) {
        dto.setUserId(userId);
        RegularPayment rp = regularPaymentMapper.toEntity(dto);
        rp = regularPaymentRepository.save(rp);
        return rp.getId();
    }

    @Override
    @Transactional
    public void update(Long userId, Long id, RegularPaymentDto dto) {
        RegularPayment rp = regularPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));

        if (!rp.getUserId().equals(userId))
            throw new RuntimeException("Unauthorized");

        rp.setName(dto.getName());
        rp.setCategoryId(dto.getCategoryId());
        rp.setDefaultPlannedAmount(dto.getDefaultPlannedAmount());
        rp.setNotes(dto.getNotes());
        rp.setStartDate(dto.getStartDate());
        rp.setEndDate(dto.getEndDate());
        rp.setFrequency(dto.getFrequency());
        rp.setIsActive(dto.getIsActive());

        regularPaymentRepository.save(rp);
    }

    @Override
    @Transactional
    public void delete(Long userId, @NonNull Long id) {
        RegularPayment rp = regularPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        if (!rp.getUserId().equals(userId))
            throw new RuntimeException("Unauthorized");
        regularPaymentRepository.delete(rp);
    }
}
