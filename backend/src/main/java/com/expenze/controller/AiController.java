package com.expenze.controller;

import com.expenze.dto.AiSmsResponse;
import com.expenze.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/parse-sms")
    public ResponseEntity<AiSmsResponse> parseSms(@RequestBody Map<String, String> request) {
        String rawText = request.get("text");
        log.debug("AI Parse requested for text length: {}", rawText != null ? rawText.length() : 0);
        return ResponseEntity.ok(aiService.parseSms(rawText));
    }
}
