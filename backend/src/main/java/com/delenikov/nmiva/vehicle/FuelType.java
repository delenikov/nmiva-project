package com.delenikov.nmiva.vehicle;

public enum FuelType {
  PETROL,
  DIESEL,
  LPG,
  HYBRID,
  ELECTRIC,
  OTHER;

  public static FuelType from(String value) {
    return FuelType.valueOf(value.toUpperCase());
  }
}
