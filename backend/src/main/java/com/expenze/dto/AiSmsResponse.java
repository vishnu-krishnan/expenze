package com.expenze.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSmsResponse {
    private List<ParsedExpense> expenses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedExpense {
        private String name;
        private Double amount;
        private String categorySuggestion;
        private String priority; // HIGH, MEDIUM, LOW
        private String rawText;
    }
}
