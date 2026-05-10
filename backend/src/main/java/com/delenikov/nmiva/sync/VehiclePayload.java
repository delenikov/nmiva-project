package com.delenikov.nmiva.sync;

import java.math.BigDecimal;

public record VehiclePayload(
    String brand,
    String model,
    Integer year,
    String fuelType,
    BigDecimal odometerStart,
    Boolean deleted
) {}
