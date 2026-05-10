package com.delenikov.nmiva.sync;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EntryPayload(
    Long vehicleId,
    String type,
    LocalDate date,
    String title,
    String notes,
    BigDecimal odometer,
    BigDecimal cost,
    BigDecimal liters,
    BigDecimal pricePerLiter,
    Boolean isFullTank,
    String serviceCategory,
    String expenseCategory,
    LocalDate dueDate,
    Boolean repeatYearly,
    Boolean completed,
    Boolean deleted
) {}
