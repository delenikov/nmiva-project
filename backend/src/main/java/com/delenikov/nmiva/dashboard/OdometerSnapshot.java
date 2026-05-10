package com.delenikov.nmiva.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OdometerSnapshot(
    LocalDate date,
    BigDecimal odometer
) {}
