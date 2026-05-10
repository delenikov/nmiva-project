package com.delenikov.nmiva.vehicle;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record VehicleRequest(
    @NotBlank(message = "Brand is required")
    String brand,
    @NotBlank(message = "Model is required")
    String model,
    @NotNull(message = "Year is required")
    @Min(value = 1950, message = "Year must be >= 1950")
    @Max(value = 2100, message = "Year must be <= 2100")
    Integer year,
    @NotBlank(message = "Fuel type is required")
    String fuelType,
    @NotNull(message = "Starting odometer is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Odometer must be >= 0")
    BigDecimal odometerStart
) {}
