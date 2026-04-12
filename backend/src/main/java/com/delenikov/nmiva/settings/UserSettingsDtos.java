package com.delenikov.nmiva.settings;

import jakarta.validation.constraints.NotBlank;

public class UserSettingsDtos {
  public record UserSettingsResponse(
      String currency,
      boolean pushEnabled
  ) {}

  public record UpdateSettingsRequest(
      @NotBlank(message = "Currency is required")
      String currency,
      Boolean pushEnabled
  ) {}
}
