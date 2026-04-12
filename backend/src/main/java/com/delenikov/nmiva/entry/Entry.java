package com.delenikov.nmiva.entry;

import com.delenikov.nmiva.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "entries")
public class Entry extends AuditableEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "vehicle_id", nullable = false)
  private Long vehicleId;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EntryType type;

  @Column(nullable = false)
  private LocalDate date;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String notes;

  private BigDecimal odometer;

  private BigDecimal cost;

  @Enumerated(EnumType.STRING)
  @Column(name = "sync_status", nullable = false)
  private SyncStatus syncStatus;

  @Column(name = "last_modified_at", nullable = false)
  private Instant lastModifiedAt;

  @Column(nullable = false)
  private boolean deleted;

  private BigDecimal liters;

  @Column(name = "price_per_liter")
  private BigDecimal pricePerLiter;

  @Column(name = "is_full_tank", nullable = false)
  private boolean isFullTank;

  @Enumerated(EnumType.STRING)
  @Column(name = "service_category")
  private ServiceCategory serviceCategory;

  @Enumerated(EnumType.STRING)
  @Column(name = "expense_category")
  private ExpenseCategory expenseCategory;

  @Column(name = "due_date")
  private LocalDate dueDate;

  @Column(name = "repeat_yearly", nullable = false)
  private boolean repeatYearly;

  @Column(nullable = false)
  private boolean completed;

  @Column(name = "reminder_notified_at")
  private Instant reminderNotifiedAt;

  @PrePersist
  protected void setDefaults() {
    if (syncStatus == null) {
      syncStatus = SyncStatus.SYNCED;
    }
    lastModifiedAt = Instant.now();
  }

  @PreUpdate
  protected void setModified() {
    lastModifiedAt = Instant.now();
  }
}
