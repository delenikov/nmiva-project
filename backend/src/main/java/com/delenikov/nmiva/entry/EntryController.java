package com.delenikov.nmiva.entry;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class EntryController {
  private final EntryService entryService;

  @GetMapping("/api/vehicles/{vehicleId}/entries")
  public List<EntryResponse> listForVehicle(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable Long vehicleId,
      @RequestParam(required = false) String type
  ) {
    return entryService.listForVehicle(user.id(), vehicleId, type);
  }

  @PostMapping("/api/vehicles/{vehicleId}/entries")
  public EntryResponse create(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable Long vehicleId,
      @Valid @RequestBody EntryRequest request
  ) {
    return entryService.create(user.id(), vehicleId, request);
  }

  @PutMapping("/api/entries/{id}")
  public EntryResponse update(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable Long id,
      @Valid @RequestBody EntryRequest request
  ) {
    return entryService.update(user.id(), id, request);
  }

  @DeleteMapping("/api/entries/{id}")
  public void delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
    entryService.delete(user.id(), id);
  }

  @GetMapping("/api/reminders/upcoming")
  public List<ReminderResponse> upcoming(@AuthenticationPrincipal AuthenticatedUser user) {
    return entryService.upcomingReminders(user.id());
  }

  @GetMapping("/api/reminders/overdue")
  public List<ReminderResponse> overdue(@AuthenticationPrincipal AuthenticatedUser user) {
    return entryService.overdueReminders(user.id());
  }
}
