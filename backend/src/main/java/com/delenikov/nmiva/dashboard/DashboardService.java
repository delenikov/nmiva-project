package com.delenikov.nmiva.dashboard;

import com.delenikov.nmiva.entry.Entry;
import com.delenikov.nmiva.entry.EntryDtos;
import com.delenikov.nmiva.entry.EntryRepository;
import com.delenikov.nmiva.entry.EntryType;
import com.delenikov.nmiva.entry.FuelConsumptionService;
import com.delenikov.nmiva.entry.ReminderDueService;
import com.delenikov.nmiva.vehicle.Vehicle;
import com.delenikov.nmiva.vehicle.VehicleService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {
  private final VehicleService vehicleService;
  private final EntryRepository entryRepository;
  private final FuelConsumptionService fuelConsumptionService;
  private final ReminderDueService reminderDueService;

  @Transactional(readOnly = true)
  public DashboardDtos.DashboardResponse getDashboard(Long userId, Long vehicleId) {
    Vehicle vehicle = vehicleService.getOwned(vehicleId, userId);
    List<Entry> entries = entryRepository.findByUserIdAndVehicleIdAndDeletedFalseOrderByDateDescCreatedAtDesc(userId, vehicleId);
    YearMonth currentMonth = YearMonth.now();

    BigDecimal monthTotal = entries.stream()
        .filter(e -> e.getCost() != null)
        .filter(e -> e.getType() != EntryType.REMINDER)
        .filter(e -> YearMonth.from(e.getDate()).equals(currentMonth))
        .map(Entry::getCost)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal allTotal = entries.stream()
        .filter(e -> e.getCost() != null)
        .filter(e -> e.getType() != EntryType.REMINDER)
        .map(Entry::getCost)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    DashboardDtos.OdometerSnapshot odometerSnapshot = entries.stream()
        .filter(e -> e.getOdometer() != null)
        .max(Comparator.comparing(Entry::getDate).thenComparing(Entry::getCreatedAt))
        .map(entry -> new DashboardDtos.OdometerSnapshot(entry.getDate(), entry.getOdometer()))
        .orElse(null);

    List<Entry> fullTankRefuels = entryRepository
        .findByUserIdAndVehicleIdAndTypeAndDeletedFalseAndIsFullTankTrueAndOdometerIsNotNullAndLitersIsNotNullOrderByDateAscCreatedAtAsc(
            userId,
            vehicleId,
            EntryType.REFUEL
        );
    FuelConsumptionService.FuelMetrics fuelMetrics = fuelConsumptionService.calculate(fullTankRefuels);

    LocalDate today = LocalDate.now();
    List<EntryDtos.ReminderResponse> upcoming = entries.stream()
        .filter(e -> e.getType() == EntryType.REMINDER && !e.isCompleted())
        .map(e -> {
          LocalDate effective = reminderDueService.resolveEffectiveDueDate(e, today);
          boolean overdue = effective != null && effective.isBefore(today);
          return new EntryDtos.ReminderResponse(
              e.getId(),
              e.getVehicleId(),
              e.getTitle(),
              e.getDueDate(),
              effective,
              e.isRepeatYearly(),
              overdue,
              e.isCompleted()
          );
        })
        .filter(r -> r.effectiveDueDate() != null
            && !r.effectiveDueDate().isBefore(today)
            && !r.effectiveDueDate().isAfter(today.plusDays(30)))
        .sorted(Comparator.comparing(EntryDtos.ReminderResponse::effectiveDueDate))
        .toList();

    List<EntryDtos.ReminderResponse> overdue = entries.stream()
        .filter(e -> e.getType() == EntryType.REMINDER && !e.isCompleted())
        .map(e -> {
          LocalDate effective = reminderDueService.resolveEffectiveDueDate(e, today);
          boolean isOverdue = effective != null && effective.isBefore(today);
          return new EntryDtos.ReminderResponse(
              e.getId(),
              e.getVehicleId(),
              e.getTitle(),
              e.getDueDate(),
              effective,
              e.isRepeatYearly(),
              isOverdue,
              e.isCompleted()
          );
        })
        .filter(EntryDtos.ReminderResponse::overdue)
        .sorted(Comparator.comparing(EntryDtos.ReminderResponse::effectiveDueDate))
        .toList();

    return new DashboardDtos.DashboardResponse(
        new DashboardDtos.VehicleSummary(
            vehicle.getId(),
            vehicle.getBrand(),
            vehicle.getModel(),
            vehicle.getYear(),
            vehicle.getFuelType().name().toLowerCase()
        ),
        monthTotal,
        allTotal,
        odometerSnapshot,
        fuelMetrics.latestLPer100Km(),
        fuelMetrics.averageLPer100Km(),
        upcoming,
        overdue
    );
  }
}
