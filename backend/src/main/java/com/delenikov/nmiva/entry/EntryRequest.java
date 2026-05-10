package com.delenikov.nmiva.entry;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

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
