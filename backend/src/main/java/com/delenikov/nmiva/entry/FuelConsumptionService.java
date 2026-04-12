package com.delenikov.nmiva.entry;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FuelConsumptionService {

  public record FuelMetrics(BigDecimal latestLPer100Km, BigDecimal averageLPer100Km) {}

  /**
   * Uses full-tank refuels with odometer values and calculates interval consumption:
   * consumption = current_fill_liters / (current_odometer - previous_odometer) * 100.
   */
  public FuelMetrics calculate(List<Entry> fullTankRefuels) {
    if (fullTankRefuels == null || fullTankRefuels.size() < 2) {
      return new FuelMetrics(null, null);
    }

    List<BigDecimal> intervals = new ArrayList<>();
    for (int i = 1; i < fullTankRefuels.size(); i++) {
      Entry previous = fullTankRefuels.get(i - 1);
      Entry current = fullTankRefuels.get(i);
      if (previous.getOdometer() == null || current.getOdometer() == null || current.getLiters() == null) {
        continue;
      }
      BigDecimal distance = current.getOdometer().subtract(previous.getOdometer());
      if (distance.compareTo(BigDecimal.ZERO) <= 0) {
        continue;
      }
      BigDecimal consumption = current.getLiters()
          .multiply(BigDecimal.valueOf(100))
          .divide(distance, 2, RoundingMode.HALF_UP);
      intervals.add(consumption);
    }

    if (intervals.isEmpty()) {
      return new FuelMetrics(null, null);
    }

    BigDecimal latest = intervals.get(intervals.size() - 1);
    BigDecimal sum = intervals.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal average = sum.divide(BigDecimal.valueOf(intervals.size()), 2, RoundingMode.HALF_UP);
    return new FuelMetrics(latest, average);
  }
}
