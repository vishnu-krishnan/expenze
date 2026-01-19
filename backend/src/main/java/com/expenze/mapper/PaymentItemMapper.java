package com.expenze.mapper;

import com.expenze.dto.PaymentItemDto;
import com.expenze.entity.PaymentItem;
import org.springframework.stereotype.Component;

@Component
public class PaymentItemMapper {

    public PaymentItemDto toDto(PaymentItem entity) {
        if (entity == null)
            return null;
        return PaymentItemDto.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .monthPlanId(entity.getMonthPlanId())
                .categoryId(entity.getCategoryId())
                .name(entity.getName())
                .plannedAmount(entity.getPlannedAmount())
                .actualAmount(entity.getActualAmount())
                .isPaid(entity.getIsPaid())
                .notes(entity.getNotes())
                .priority(entity.getPriority())
                .build();
    }

    public PaymentItem toEntity(PaymentItemDto dto) {
        if (dto == null)
            return null;
        return PaymentItem.builder()
                .id(dto.getId())
                .userId(dto.getUserId())
                .monthPlanId(dto.getMonthPlanId())
                .categoryId(dto.getCategoryId())
                .name(dto.getName())
                .plannedAmount(dto.getPlannedAmount())
                .actualAmount(dto.getActualAmount())
                .isPaid(dto.getIsPaid())
                .notes(dto.getNotes())
                .priority(dto.getPriority())
                .build();
    }
}
