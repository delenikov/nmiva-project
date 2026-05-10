package com.delenikov.nmiva.entry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

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
