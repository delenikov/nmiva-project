package com.delenikov.nmiva.settings;

import com.delenikov.nmiva.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class UserSettingsController {
  private final UserSettingsService userSettingsService;

  @GetMapping
  public UserSettingsDtos.UserSettingsResponse get(@AuthenticationPrincipal AuthenticatedUser user) {
    return userSettingsService.getForUser(user.id());
  }

  @PutMapping
  public UserSettingsDtos.UserSettingsResponse update(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody UserSettingsDtos.UpdateSettingsRequest request
  ) {
    return userSettingsService.update(user.id(), request);
  }
}
