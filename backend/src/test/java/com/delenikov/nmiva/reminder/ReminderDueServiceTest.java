package com.delenikov.nmiva.reminder;

import static org.assertj.core.api.Assertions.assertThat;

import com.delenikov.nmiva.entry.Entry;
import com.delenikov.nmiva.entry.ReminderDueService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ReminderDueServiceTest {

  private final ReminderDueService service = new ReminderDueService();

  @Test
  void keepsNonRepeatingReminderDate() {
    Entry entry = new Entry();
    entry.setDueDate(LocalDate.of(2026, 4, 15));
    entry.setRepeatYearly(false);

    LocalDate result = service.resolveEffectiveDueDate(entry, LocalDate.of(2026, 4, 12));

    assertThat(result).isEqualTo(LocalDate.of(2026, 4, 15));
  }

  @Test
  void shiftsYearlyReminderToNextYearWhenDatePassed() {
    Entry entry = new Entry();
    entry.setDueDate(LocalDate.of(2020, 3, 1));
    entry.setRepeatYearly(true);

    LocalDate result = service.resolveEffectiveDueDate(entry, LocalDate.of(2026, 4, 12));

    assertThat(result).isEqualTo(LocalDate.of(2027, 3, 1));
  }
}
