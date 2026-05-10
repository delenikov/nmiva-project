package com.delenikov.nmiva.entry;

import java.time.LocalDate;

public record ReminderResponse(
    Long id,
    Long vehicleId,
    String title,
    LocalDate dueDate,
    LocalDate effectiveDueDate,
    boolean repeatYearly,
    boolean overdue,
    boolean completed
) {}
