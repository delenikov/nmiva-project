package com.delenikov.nmiva.vehicle;

import com.delenikov.nmiva.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {
  private final VehicleService vehicleService;

  @GetMapping
  public List<VehicleDtos.VehicleResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
    return vehicleService.list(user.id());
  }

  @PostMapping
  public VehicleDtos.VehicleResponse create(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody VehicleDtos.VehicleRequest request
  ) {
    return vehicleService.create(user.id(), request);
  }

  @PutMapping("/{id}")
  public VehicleDtos.VehicleResponse update(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable Long id,
      @Valid @RequestBody VehicleDtos.VehicleRequest request
  ) {
    return vehicleService.update(id, user.id(), request);
  }

  @DeleteMapping("/{id}")
  public void delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
    vehicleService.delete(id, user.id());
  }
}
