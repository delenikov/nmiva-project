package com.delenikov.nmiva.settings;

public record UserSettingsResponse(
    String currency,
    boolean pushEnabled
) {}
