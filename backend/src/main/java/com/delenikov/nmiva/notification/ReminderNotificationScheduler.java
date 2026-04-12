package com.delenikov.nmiva.notification;

import com.delenikov.nmiva.entry.Entry;
import com.delenikov.nmiva.entry.EntryService;
import java.time.Instant;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderNotificationScheduler {
  private final EntryService entryService;
  private final WebPushService webPushService;

  @Scheduled(cron = "${app.reminder.cron}")
  @Transactional
  public void sendReminderNotifications() {
    LocalDate today = LocalDate.now();
    for (Entry reminder : entryService.remindersDueForNotification(today)) {
      WebPushService.SendResult result = webPushService.sendToUser(
          reminder.getUserId(),
          "Vehicle reminder",
          reminder.getTitle(),
          "/app/vehicles/" + reminder.getVehicleId()
      );
      if (result.delivered() > 0) {
        reminder.setReminderNotifiedAt(Instant.now());
        entryService.save(reminder);
        log.debug("Reminder push sent for entry {}", reminder.getId());
      } else {
        log.warn("Reminder push not delivered for entry {}. message={}", reminder.getId(), result.message());
      }
    }
  }
}
