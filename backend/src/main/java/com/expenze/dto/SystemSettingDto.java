package com.expenze.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SystemSettingDto {
    private String settingKey;
    private String settingValue;
    private String settingType;
    private String description;
    private String category;
    private Integer isPublic;
}
