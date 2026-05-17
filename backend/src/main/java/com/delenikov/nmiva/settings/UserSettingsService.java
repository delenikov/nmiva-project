package com.delenikov.nmiva.settings;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSettingsService {
  private final UserSettingsRepository repository;

  @Transactional(readOnly = true)
  public UserSettingsResponse getForUser(Long userId) {
    UserSettings settings = repository.findByUserId(userId).orElseGet(() -> createDefault(userId));
    return new UserSettingsResponse(settings.getCurrency(), settings.isPushEnabled());
  }

  @Transactional
  public UserSettingsResponse update(Long userId, UpdateSettingsRequest request) {
    UserSettings settings = repository.findByUserId(userId).orElseGet(() -> createDefault(userId));
    settings.setCurrency(request.currency().trim());
    settings.setPushEnabled(request.pushEnabled() == null || request.pushEnabled());
    settings = repository.save(settings);
    return new UserSettingsResponse(settings.getCurrency(), settings.isPushEnabled());
  }

  private UserSettings createDefault(Long userId) {
    UserSettings settings = new UserSettings();
    settings.setUserId(userId);
    settings.setCurrency("мкд");
    settings.setPushEnabled(true);
    return repository.save(settings);
  }
}
