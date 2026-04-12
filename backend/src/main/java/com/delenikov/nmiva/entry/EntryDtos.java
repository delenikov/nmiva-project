package com.delenikov.nmiva.entry;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public class EntryDtos {

  public record EntryRequest(
      @NotBlank(message = "Type is required")
      String type,
      @NotNull(message = "Date is required")
      LocalDate date,
      @NotBlank(message = "Title is required")
      String title,
      String notes,
      @DecimalMin(value = "0.0", inclusive = true, message = "Odometer must be >= 0")
      BigDecimal odometer,
      @DecimalMin(value = "0.0", inclusive = true, message = "Cost must be >= 0")
      BigDecimal cost,
      @DecimalMin(value = "0.0", inclusive = true, message = "Liters must be >= 0")
      BigDecimal liters,
      @DecimalMin(value = "0.0", inclusive = true, message = "Price per liter must be >= 0")
      BigDecimal pricePerLiter,
      Boolean isFullTank,
      String serviceCategory,
      String expenseCategory,
      LocalDate dueDate,
      Boolean repeatYearly,
      Boolean completed
  ) {}

  public record EntryResponse(
      Long id,
      Long vehicleId,
      Long userId,
      String type,
      LocalDate date,
      String title,
      String notes,
      BigDecimal odometer,
      BigDecimal cost,
      BigDecimal liters,
      BigDecimal pricePerLiter,
      boolean isFullTank,
      String serviceCategory,
      String expenseCategory,
      LocalDate dueDate,
      boolean repeatYearly,
      boolean completed,
      String syncStatus,
      boolean deleted,
      Instant lastModifiedAt,
      Instant createdAt,
      Instant updatedAt
  ) {}

  public record ReminderResponse(
      Long id,
      Long vehicleId,
      String title,
      LocalDate dueDate,
      LocalDate effectiveDueDate,
      boolean repeatYearly,
      boolean overdue,
      boolean completed
  ) {}
}
