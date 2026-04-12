package com.delenikov.nmiva.notification;

import jakarta.validation.constraints.NotBlank;

public class PushDtos {
  public record PushSubscriptionRequest(
      @NotBlank(message = "Endpoint is required")
      String endpoint,
      @NotBlank(message = "p256dh is required")
      String p256dh,
      @NotBlank(message = "auth is required")
      String auth
  ) {}

  public record PushUnsubscribeRequest(
      String endpoint
  ) {}

  public record PushTestRequest(
      String title,
      String body
  ) {}

  public record PushStatusResponse(
      String status,
      Integer subscriptions,
      Integer delivered,
      Integer failed,
      String message
  ) {
    public static PushStatusResponse simple(String status) {
      return new PushStatusResponse(status, null, null, null, null);
    }
  }
}
