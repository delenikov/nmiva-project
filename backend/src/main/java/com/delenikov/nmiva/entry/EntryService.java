package com.delenikov.nmiva.entry;

import com.delenikov.nmiva.common.ApiException;
import com.delenikov.nmiva.vehicle.VehicleService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EntryService {
  private final EntryRepository entryRepository;
  private final VehicleService vehicleService;
  private final ReminderDueService reminderDueService;

  @Transactional(readOnly = true)
  public List<EntryResponse> listForVehicle(Long userId, Long vehicleId, String type) {
    vehicleService.getOwned(vehicleId, userId);
    List<Entry> entries;
    if (type == null || type.isBlank()) {
      entries = entryRepository.findByUserIdAndVehicleIdAndDeletedFalseOrderByDateDescCreatedAtDesc(userId, vehicleId);
    } else {
      entries = entryRepository.findByUserIdAndVehicleIdAndTypeAndDeletedFalseOrderByDateDescCreatedAtDesc(
          userId,
          vehicleId,
          EntryType.from(type)
      );
    }
    return entries.stream().map(this::toResponse).toList();
  }

  @Transactional
  public EntryResponse create(Long userId, Long vehicleId, EntryRequest request) {
    vehicleService.getOwned(vehicleId, userId);
    Entry entry = new Entry();
    entry.setUserId(userId);
    entry.setVehicleId(vehicleId);
    entry.setDeleted(false);
    entry.setSyncStatus(SyncStatus.SYNCED);
    apply(entry, request);
    entry.setLastModifiedAt(Instant.now());
    return toResponse(entryRepository.save(entry));
  }

  @Transactional
  public EntryResponse update(Long userId, Long entryId, EntryRequest request) {
    Entry entry = getOwned(entryId, userId);
    apply(entry, request);
    entry.setLastModifiedAt(Instant.now());
    return toResponse(entryRepository.save(entry));
  }

  @Transactional
  public void delete(Long userId, Long entryId) {
    Entry entry = getOwned(entryId, userId);
    entry.setDeleted(true);
    entry.setSyncStatus(SyncStatus.PENDING_DELETE);
    entry.setLastModifiedAt(Instant.now());
    entryRepository.save(entry);
  }

  @Transactional(readOnly = true)
  public Entry getOwned(Long entryId, Long userId) {
    return entryRepository.findByIdAndUserId(entryId, userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Entry not found"));
  }

  @Transactional(readOnly = true)
  public List<Entry> fullTankRefuels(Long userId, Long vehicleId) {
    return entryRepository
        .findByUserIdAndVehicleIdAndTypeAndDeletedFalseAndIsFullTankTrueAndOdometerIsNotNullAndLitersIsNotNullOrderByDateAscCreatedAtAsc(
            userId,
            vehicleId,
            EntryType.REFUEL
        );
  }

  @Transactional(readOnly = true)
  public List<ReminderResponse> upcomingReminders(Long userId) {
    LocalDate today = LocalDate.now();
    LocalDate next30 = today.plusDays(365);
    return entryRepository.findByUserIdAndTypeAndDeletedFalseAndCompletedFalse(userId, EntryType.REMINDER).stream()
        .map(entry -> toReminderResponse(entry, reminderDueService.resolveEffectiveDueDate(entry, today), today))
        .filter(reminder -> reminder.effectiveDueDate() != null
            && !reminder.effectiveDueDate().isBefore(today)
            && !reminder.effectiveDueDate().isAfter(next30))
        .sorted(Comparator.comparing(ReminderResponse::effectiveDueDate))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ReminderResponse> overdueReminders(Long userId) {
    LocalDate today = LocalDate.now();
    return entryRepository.findByUserIdAndTypeAndDeletedFalseAndCompletedFalse(userId, EntryType.REMINDER).stream()
        .map(entry -> toReminderResponse(entry, reminderDueService.resolveEffectiveDueDate(entry, today), today))
        .filter(ReminderResponse::overdue)
        .sorted(Comparator.comparing(ReminderResponse::effectiveDueDate))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<Entry> remindersDueForNotification(LocalDate today) {
    return entryRepository.findByTypeAndDeletedFalseAndCompletedFalse(EntryType.REMINDER).stream()
        .filter(entry -> {
          LocalDate effective = reminderDueService.resolveEffectiveDueDate(entry, today);
          if (effective == null || effective.isAfter(today)) {
            return false;
          }
          if (entry.getReminderNotifiedAt() == null) {
            return true;
          }
          LocalDate notifiedDate = entry.getReminderNotifiedAt().atZone(java.time.ZoneOffset.UTC).toLocalDate();
          return !notifiedDate.equals(effective);
        })
        .toList();
  }

  @Transactional(readOnly = true)
  public List<Entry> changesSince(Long userId, Instant lastPulledAt) {
    if (lastPulledAt == null) {
      return entryRepository.findByUserIdOrderByLastModifiedAtAsc(userId);
    }
    return entryRepository.findByUserIdAndLastModifiedAtAfterOrderByLastModifiedAtAsc(userId, lastPulledAt);
  }

  @Transactional
  public Entry save(Entry entry) {
    return entryRepository.save(entry);
  }

  public EntryResponse toResponse(Entry entry) {
    return new EntryResponse(
        entry.getId(),
        entry.getVehicleId(),
        entry.getUserId(),
        entry.getType().name().toLowerCase(),
        entry.getDate(),
        entry.getTitle(),
        entry.getNotes(),
        entry.getOdometer(),
        entry.getCost(),
        entry.getLiters(),
        entry.getPricePerLiter(),
        entry.isFullTank(),
        entry.getServiceCategory() == null ? null : entry.getServiceCategory().name().toLowerCase(),
        entry.getExpenseCategory() == null ? null : entry.getExpenseCategory().name().toLowerCase(),
        entry.getDueDate(),
        entry.isRepeatYearly(),
        entry.isCompleted(),
        entry.getSyncStatus().name().toLowerCase(),
        entry.isDeleted(),
        entry.getLastModifiedAt(),
        entry.getCreatedAt(),
        entry.getUpdatedAt()
    );
  }

  public void apply(Entry entry, EntryRequest request) {
    EntryType type = EntryType.from(request.type());
    entry.setType(type);
    entry.setDate(request.date());
    entry.setTitle(request.title().trim());
    entry.setNotes(request.notes());
    entry.setOdometer(request.odometer());
    entry.setCost(request.cost());
    entry.setLiters(request.liters());
    entry.setPricePerLiter(request.pricePerLiter());
    entry.setFullTank(request.isFullTank() == null || request.isFullTank());
    entry.setDueDate(request.dueDate());
    entry.setRepeatYearly(request.repeatYearly() != null && request.repeatYearly());
    entry.setCompleted(request.completed() != null && request.completed());
    entry.setServiceCategory(request.serviceCategory() == null || request.serviceCategory().isBlank()
        ? null
        : ServiceCategory.valueOf(request.serviceCategory().toUpperCase()));
    entry.setExpenseCategory(request.expenseCategory() == null || request.expenseCategory().isBlank()
        ? null
        : ExpenseCategory.valueOf(request.expenseCategory().toUpperCase()));
    entry.setSyncStatus(SyncStatus.SYNCED);
    validateByType(entry);
  }

  private ReminderResponse toReminderResponse(Entry entry, LocalDate effectiveDueDate, LocalDate today) {
    boolean overdue = effectiveDueDate != null && effectiveDueDate.isBefore(today) && !entry.isCompleted();
    return new ReminderResponse(
        entry.getId(),
        entry.getVehicleId(),
        entry.getTitle(),
        entry.getDueDate(),
        effectiveDueDate,
        entry.isRepeatYearly(),
        overdue,
        entry.isCompleted()
    );
  }

  private void validateByType(Entry entry) {
    switch (entry.getType()) {
      case REFUEL -> {
        if (entry.getLiters() == null) {
          throw new ApiException(HttpStatus.BAD_REQUEST, "Refuel entries require liters");
        }
      }
      case SERVICE -> {
        if (entry.getServiceCategory() == null) {
          throw new ApiException(HttpStatus.BAD_REQUEST, "Service entries require serviceCategory");
        }
      }
      case EXPENSE -> {
        if (entry.getExpenseCategory() == null) {
          throw new ApiException(HttpStatus.BAD_REQUEST, "Expense entries require expenseCategory");
        }
      }
      case REMINDER -> {
        if (entry.getDueDate() == null) {
          throw new ApiException(HttpStatus.BAD_REQUEST, "Reminder entries require dueDate");
        }
      }
    }
  }
}
