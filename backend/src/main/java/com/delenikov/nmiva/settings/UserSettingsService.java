package com.delenikov.nmiva.settings;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSettingsService {
  private final UserSettingsRepository repository;

  @Transactional(readOnly = true)
  public UserSettingsDtos.UserSettingsResponse getForUser(Long userId) {
    UserSettings settings = repository.findByUserId(userId).orElseGet(() -> createDefault(userId));
    return new UserSettingsDtos.UserSettingsResponse(settings.getCurrency(), settings.isPushEnabled());
  }

  @Transactional
  public UserSettingsDtos.UserSettingsResponse update(Long userId, UserSettingsDtos.UpdateSettingsRequest request) {
    UserSettings settings = repository.findByUserId(userId).orElseGet(() -> createDefault(userId));
    settings.setCurrency(request.currency().trim().toUpperCase());
    settings.setPushEnabled(request.pushEnabled() == null || request.pushEnabled());
    settings = repository.save(settings);
    return new UserSettingsDtos.UserSettingsResponse(settings.getCurrency(), settings.isPushEnabled());
  }

  private UserSettings createDefault(Long userId) {
    UserSettings settings = new UserSettings();
    settings.setUserId(userId);
    settings.setCurrency("EUR");
    settings.setPushEnabled(true);
    return repository.save(settings);
  }
}
