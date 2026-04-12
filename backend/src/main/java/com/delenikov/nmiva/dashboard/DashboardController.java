package com.delenikov.nmiva.dashboard;

import com.delenikov.nmiva.auth.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles/{vehicleId}/dashboard")
@RequiredArgsConstructor
public class DashboardController {
  private final DashboardService dashboardService;

  @GetMapping
  public DashboardDtos.DashboardResponse dashboard(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable Long vehicleId
  ) {
    return dashboardService.getDashboard(user.id(), vehicleId);
  }
}
