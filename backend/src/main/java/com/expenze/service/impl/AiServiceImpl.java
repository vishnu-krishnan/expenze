package com.expenze.service.impl;

import com.expenze.dto.AiSmsResponse;
import com.expenze.service.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.groq.api-key:}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    @Override
    public AiSmsResponse parseSms(String rawText) {
        if (groqApiKey == null || groqApiKey.isEmpty()) {
            log.warn("Groq API Key is not configured. Falling back to empty response.");
            return AiSmsResponse.builder().expenses(new ArrayList<>()).build();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            String systemPrompt = "You are a specialized financial parser. Extract transaction details from the provided SMS text. "
                    +
                    "Return ONLY a JSON object with this structure: { \"expenses\": [ { \"name\": \"Merchant Name\", \"amount\": 123.45, \"categorySuggestion\": \"Dining/Shopping/etc\", \"priority\": \"HIGH/MEDIUM/LOW\", \"rawText\": \"Original line\" } ] }. "
                    +
                    "If a line is not a transaction, ignore it.";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.3-70b-versatile");

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", rawText));
            requestBody.put("messages", messages);
            requestBody.put("response_format", Map.of("type", "json_object"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(GROQ_URL, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> body = objectMapper.readValue(response.getBody(), Map.class);
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (!choices.isEmpty()) {
                    String content = (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");
                    return objectMapper.readValue(content, AiSmsResponse.class);
                }
            }
        } catch (Exception e) {
            log.error("Error calling Groq AI:", e);
        }

        return AiSmsResponse.builder().expenses(new ArrayList<>()).build();
    }
}
