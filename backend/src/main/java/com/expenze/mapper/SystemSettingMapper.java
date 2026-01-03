package com.expenze.mapper;

import com.expenze.dto.SystemSettingDto;
import com.expenze.entity.SystemSetting;
import org.springframework.stereotype.Component;

@Component
public class SystemSettingMapper {

    public SystemSettingDto toDto(SystemSetting entity) {
        if (entity == null)
            return null;
        return SystemSettingDto.builder()
                .settingKey(entity.getSettingKey())
                .settingValue(entity.getSettingValue())
                .settingType(entity.getSettingType())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .isPublic(entity.getIsPublic())
                .build();
    }
}
