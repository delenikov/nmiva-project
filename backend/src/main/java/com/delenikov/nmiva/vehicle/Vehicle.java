package com.delenikov.nmiva.vehicle;

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
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "vehicles")
public class Vehicle extends AuditableEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(nullable = false)
  private String brand;

  @Column(nullable = false)
  private String model;

  @Column(nullable = false)
  private Integer year;

  @Column(name = "fuel_type", nullable = false)
  @Enumerated(EnumType.STRING)
  private FuelType fuelType;

  @Column(name = "odometer_start", nullable = false)
  private BigDecimal odometerStart;

  @Column(nullable = false)
  private boolean deleted;

  @Column(name = "last_modified_at", nullable = false)
  private Instant lastModifiedAt;

  @PrePersist
  protected void setCreateDefaults() {
    lastModifiedAt = Instant.now();
  }

  @PreUpdate
  protected void touchModifiedAt() {
    lastModifiedAt = Instant.now();
  }
}
