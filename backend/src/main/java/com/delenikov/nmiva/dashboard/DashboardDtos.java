package com.delenikov.nmiva.dashboard;

import com.delenikov.nmiva.entry.EntryDtos;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DashboardDtos {

  public record VehicleSummary(
      Long id,
      String brand,
      String model,
      Integer year,
      String fuelType
  ) {}

  public record OdometerSnapshot(
      LocalDate date,
      BigDecimal odometer
  ) {}

  public record DashboardResponse(
      VehicleSummary vehicle,
      BigDecimal totalSpentThisMonth,
      BigDecimal totalSpentAllTime,
      OdometerSnapshot latestOdometerEntry,
      BigDecimal latestFuelConsumptionLPer100Km,
      BigDecimal averageFuelConsumptionLPer100Km,
      List<EntryDtos.ReminderResponse> upcomingReminders,
      List<EntryDtos.ReminderResponse> overdueReminders
  ) {}
}
