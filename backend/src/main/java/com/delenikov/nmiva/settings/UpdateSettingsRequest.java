package com.delenikov.nmiva.settings;

import jakarta.validation.constraints.NotBlank;

public record UpdateSettingsRequest(
    @NotBlank(message = "Currency is required")
    String currency,
    Boolean pushEnabled
) {}
