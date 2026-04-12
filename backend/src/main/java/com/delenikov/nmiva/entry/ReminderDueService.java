package com.delenikov.nmiva.entry;

import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class ReminderDueService {

  public LocalDate resolveEffectiveDueDate(Entry reminder, LocalDate today) {
    if (reminder.getDueDate() == null) {
      return null;
    }
    if (!reminder.isRepeatYearly()) {
      return reminder.getDueDate();
    }

    LocalDate base = reminder.getDueDate();
    LocalDate thisYear = base.withYear(today.getYear());
    if (thisYear.isBefore(today)) {
      return thisYear.plusYears(1);
    }
    return thisYear;
  }
}
