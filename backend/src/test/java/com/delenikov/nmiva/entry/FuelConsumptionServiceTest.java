package com.delenikov.nmiva.entry;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class FuelConsumptionServiceTest {

  private final FuelConsumptionService service = new FuelConsumptionService();

  @Test
  void calculatesLatestAndAverageConsumptionFromFullTankIntervals() {
    Entry first = new Entry();
    first.setDate(LocalDate.of(2026, 1, 1));
    first.setOdometer(BigDecimal.valueOf(10000));
    first.setLiters(BigDecimal.valueOf(30));

    Entry second = new Entry();
    second.setDate(LocalDate.of(2026, 1, 10));
    second.setOdometer(BigDecimal.valueOf(10400));
    second.setLiters(BigDecimal.valueOf(32));

    Entry third = new Entry();
    third.setDate(LocalDate.of(2026, 1, 20));
    third.setOdometer(BigDecimal.valueOf(10800));
    third.setLiters(BigDecimal.valueOf(36));

    FuelConsumptionService.FuelMetrics metrics = service.calculate(List.of(first, second, third));

    assertThat(metrics.latestLPer100Km()).isEqualByComparingTo("9.00");
    assertThat(metrics.averageLPer100Km()).isEqualByComparingTo("8.50");
  }
}
