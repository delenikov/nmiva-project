package com.delenikov.nmiva.vehicle;

import java.math.BigDecimal;
import java.time.Instant;

public record VehicleResponse(
    Long id,
    Long userId,
    String brand,
    String model,
    Integer year,
    String fuelType,
    BigDecimal odometerStart,
    boolean deleted,
    Instant createdAt,
    Instant updatedAt,
    Instant lastModifiedAt
) {}
