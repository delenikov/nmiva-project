package com.delenikov.nmiva.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Utils;
import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebPushService {
  public record SendResult(int subscriptions, int delivered, int failed, String message) {}

  private final PushSubscriptionRepository repository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Value("${app.push.public-key}")
  private String publicKey;

  @Value("${app.push.private-key}")
  private String privateKey;

  @Value("${app.push.subject}")
  private String subject;

  public boolean hasVapidConfig() {
    String normalizedPublicKey = normalizeKey(publicKey);
    String normalizedPrivateKey = normalizeKey(privateKey);
    return normalizedPublicKey != null && !normalizedPublicKey.isBlank()
        && normalizedPrivateKey != null && !normalizedPrivateKey.isBlank();
  }

  public void subscribe(Long userId, PushDtos.PushSubscriptionRequest request) {

    log.info("Subscribe request received for userId={}, endpoint={}", userId, request.endpoint());

    PushSubscription existing = repository.findByUserIdAndEndpoint(userId, request.endpoint()).orElse(null);

    if (existing == null) {
      log.info("No existing subscription found. Creating new subscription for userId={}", userId);
      existing = new PushSubscription();
      existing.setUserId(userId);
      existing.setEndpoint(request.endpoint());
    } else {
      log.info("Existing subscription found. Updating keys for userId={}", userId);
    }

    log.debug("Setting subscription keys for userId={} (p256dh length={}, auth length={})",
        userId,
        request.p256dh() != null ? request.p256dh().length() : 0,
        request.auth() != null ? request.auth().length() : 0
    );

    existing.setP256dh(request.p256dh());
    existing.setAuth(request.auth());

    repository.save(existing);

    log.info("Subscription saved successfully for userId={}, endpoint={}", userId, request.endpoint());
  }

  @Transactional
  public void unsubscribe(Long userId, String endpoint) {
    if (endpoint == null || endpoint.isBlank()) {
      repository.deleteByUserId(userId);
      return;
    }
    repository.deleteByUserIdAndEndpoint(userId, endpoint);
  }

  public SendResult sendTest(Long userId, String title, String body) {
    return sendToUser(userId, title == null || title.isBlank() ? "NMIVA test notification" : title,
        body == null || body.isBlank() ? "Push notifications are configured successfully." : body,
        "/app/settings");
  }

  public SendResult sendToUser(Long userId, String title, String body, String url) {
    if (!hasVapidConfig()) {
      log.warn("Push skipped because VAPID keys are not configured");
      return new SendResult(0, 0, 0, "VAPID keys are not configured");
    }
    List<PushSubscription> subscriptions = repository.findByUserId(userId);
    if (subscriptions.isEmpty()) {
      return new SendResult(0, 0, 0, "No push subscriptions found for user");
    }

    PushService pushService;
    try {
      pushService = createPushService();
    } catch (IllegalStateException ex) {
      return new SendResult(subscriptions.size(), 0, subscriptions.size(), ex.getMessage());
    }
    String payload = payloadJson(title, body, url);
    int delivered = 0;
    int failed = 0;
    for (PushSubscription subscription : subscriptions) {
      try {
        Notification notification = new Notification(
            subscription.getEndpoint(),
            subscription.getP256dh(),
            subscription.getAuth(),
            payload
        );
        HttpResponse response = pushService.send(notification);
        int status = response.getStatusLine().getStatusCode();
        if (status >= 200 && status < 300) {
          delivered++;
        } else {
          failed++;
          log.warn("Push delivery non-success status {} for subscription {}", status, subscription.getId());
        }
        if (status == 404 || status == 410) {
          repository.delete(subscription);
        }
      } catch (Exception ex) {
        failed++;
        log.warn("Failed to send push to subscription {}: {}", subscription.getId(), ex.getMessage());
      }
    }
    return new SendResult(subscriptions.size(), delivered, failed, null);
  }

  private String payloadJson(String title, String body, String url) {
    try {
      HashMap<String, Object> payload = new HashMap<>();
      payload.put("title", title);
      payload.put("body", body);
      payload.put("url", url);
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Cannot serialize push payload", ex);
    }
  }

  private PushService createPushService() {
    try {
      String normalizedPublicKey = normalizeKey(publicKey);
      String normalizedPrivateKey = normalizeKey(privateKey);
      String normalizedSubject = normalizeSubject(subject);
      return new PushService()
          .setPublicKey(Utils.loadPublicKey(normalizedPublicKey))
          .setPrivateKey(Utils.loadPrivateKey(normalizedPrivateKey))
          .setSubject(normalizedSubject);
    } catch (GeneralSecurityException ex) {
      throw new IllegalStateException("Invalid VAPID key configuration: " + ex.getMessage(), ex);
    }
  }

  private String normalizeKey(String key) {
    if (key == null) {
      return null;
    }
    String normalized = key.trim();
    if ((normalized.startsWith("\"") && normalized.endsWith("\""))
        || (normalized.startsWith("'") && normalized.endsWith("'"))) {
      normalized = normalized.substring(1, normalized.length() - 1);
    }
    return normalized.replaceAll("\\s+", "");
  }

  private String normalizeSubject(String value) {
    if (value == null) {
      return null;
    }
    String normalized = value.trim();
    if ((normalized.startsWith("\"") && normalized.endsWith("\""))
        || (normalized.startsWith("'") && normalized.endsWith("'"))) {
      return normalized.substring(1, normalized.length() - 1);
    }
    return normalized;
  }
}
