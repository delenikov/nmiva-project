package com.delenikov.nmiva.notification;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WebPushServiceTest {

  @Mock
  private PushSubscriptionRepository repository;

  private WebPushService service;

  @BeforeEach
  void setUp() {
    service = new WebPushService(repository);
  }

  @Test
  void subscribeUpdatesExistingSubscriptionKeys() {
    PushSubscription existing = new PushSubscription();
    existing.setUserId(1L);
    existing.setEndpoint("https://example.com/sub");
    existing.setP256dh("old");
    existing.setAuth("old");

    when(repository.findByUserIdAndEndpoint(1L, "https://example.com/sub"))
        .thenReturn(Optional.of(existing));

    service.subscribe(1L, new PushDtos.PushSubscriptionRequest("https://example.com/sub", "newP256dh", "newAuth"));

    verify(repository).save(existing);
  }
}
