package com.delenikov.nmiva.notification;

import com.delenikov.nmiva.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "push_subscriptions")
public class PushSubscription extends AuditableEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String endpoint;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String p256dh;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String auth;
}
