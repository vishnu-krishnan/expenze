package com.expenze.service;

import com.expenze.dto.AiSmsResponse;

public interface AiService {
    AiSmsResponse parseSms(String rawText);
}
