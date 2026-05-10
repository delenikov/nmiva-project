package com.delenikov.nmiva.sync;

import com.delenikov.nmiva.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {
  private final SyncService syncService;

  @PostMapping
  public SyncResponse sync(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody SyncRequest request
  ) {
    return syncService.sync(user.id(), request);
  }
}
