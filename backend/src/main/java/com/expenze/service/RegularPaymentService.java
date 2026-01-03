package com.expenze.service;

import com.expenze.dto.RegularPaymentDto;
import java.util.List;

public interface RegularPaymentService {
    List<RegularPaymentDto> getAll(Long userId);

    Long create(Long userId, RegularPaymentDto dto);

    void update(Long userId, Long id, RegularPaymentDto dto);

    void delete(Long userId, Long id);
}
