package com.expenze.mapper;

import com.expenze.dto.RegularPaymentDto;
import com.expenze.entity.RegularPayment;
import org.springframework.stereotype.Component;

@Component
public class RegularPaymentMapper {

    public RegularPaymentDto toDto(RegularPayment entity) {
        if (entity == null)
            return null;
        return RegularPaymentDto.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .name(entity.getName())
                .categoryId(entity.getCategoryId())
                .defaultPlannedAmount(entity.getDefaultPlannedAmount())
                .notes(entity.getNotes())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .frequency(entity.getFrequency())
                .isActive(entity.getIsActive())
                .build();
    }

    public RegularPayment toEntity(RegularPaymentDto dto) {
        if (dto == null)
            return null;
        return RegularPayment.builder()
                .id(dto.getId())
                .userId(dto.getUserId())
                .name(dto.getName())
                .categoryId(dto.getCategoryId())
                .defaultPlannedAmount(dto.getDefaultPlannedAmount())
                .notes(dto.getNotes())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .frequency(dto.getFrequency())
                .isActive(dto.getIsActive())
                .build();
    }
}
