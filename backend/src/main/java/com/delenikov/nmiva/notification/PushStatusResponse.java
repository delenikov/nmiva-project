package com.delenikov.nmiva.notification;

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
