package com.delenikov.nmiva.dashboard;

public record VehicleSummary(
    Long id,
    String brand,
    String model,
    Integer year,
    String fuelType
) {}
