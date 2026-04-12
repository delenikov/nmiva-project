package com.delenikov.nmiva.sync;

import com.delenikov.nmiva.entry.EntryDtos;
import com.delenikov.nmiva.vehicle.VehicleDtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class SyncDtos {

  public record SyncRequest(
      Instant lastPulledAt,
      @Valid List<ChangeRecord> vehicleChanges,
      @Valid List<ChangeRecord> entryChanges
  ) {}

  public record ChangeRecord(
      String localId,
      Long serverId,
      @NotNull SyncOperation operation,
      Instant lastModifiedAt,
      Map<String, Object> payload
  ) {}

  public record SyncAck(
      String entityType,
      String localId,
      Long serverId,
      String status,
      String message
  ) {}

  public record SyncResponse(
      Instant serverTime,
      List<SyncAck> acknowledgements,
      List<VehicleDtos.VehicleResponse> vehicles,
      List<EntryDtos.EntryResponse> entries
  ) {}

  public record VehiclePayload(
      String brand,
      String model,
      Integer year,
      String fuelType,
      java.math.BigDecimal odometerStart,
      Boolean deleted
  ) {}

  public record EntryPayload(
      Long vehicleId,
      String type,
      LocalDate date,
      String title,
      String notes,
      java.math.BigDecimal odometer,
      java.math.BigDecimal cost,
      java.math.BigDecimal liters,
      java.math.BigDecimal pricePerLiter,
      Boolean isFullTank,
      String serviceCategory,
      String expenseCategory,
      LocalDate dueDate,
      Boolean repeatYearly,
      Boolean completed,
      Boolean deleted
  ) {}
}
