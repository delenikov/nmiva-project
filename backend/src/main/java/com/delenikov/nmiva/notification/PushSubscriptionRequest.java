package com.delenikov.nmiva.notification;

import jakarta.validation.constraints.NotBlank;

public record PushSubscriptionRequest(
    @NotBlank(message = "Endpoint is required")
    String endpoint,
    @NotBlank(message = "p256dh is required")
    String p256dh,
    @NotBlank(message = "auth is required")
    String auth
) {}
