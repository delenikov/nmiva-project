package com.delenikov.nmiva.notification;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
  List<PushSubscription> findByUserId(Long userId);

  Optional<PushSubscription> findByUserIdAndEndpoint(Long userId, String endpoint);

  void deleteByUserIdAndEndpoint(Long userId, String endpoint);

  void deleteByUserId(Long userId);
}
