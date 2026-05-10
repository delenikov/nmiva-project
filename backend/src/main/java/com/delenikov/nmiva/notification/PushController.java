package com.delenikov.nmiva.notification;

import com.delenikov.nmiva.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {
  private final WebPushService webPushService;

  @PostMapping("/subscribe")
  public PushStatusResponse subscribe(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody PushSubscriptionRequest request
  ) {
    webPushService.subscribe(user.id(), request);
    return PushStatusResponse.simple("subscribed");
  }

  @PostMapping("/unsubscribe")
  public PushStatusResponse unsubscribe(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestBody(required = false) PushUnsubscribeRequest request
  ) {
    String endpoint = request == null ? null : request.endpoint();
    webPushService.unsubscribe(user.id(), endpoint);
    return PushStatusResponse.simple("unsubscribed");
  }

  @PostMapping("/test")
  public PushStatusResponse test(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestBody(required = false) PushTestRequest request
  ) {
    String title = request == null ? null : request.title();
    String body = request == null ? null : request.body();
    WebPushService.SendResult result = webPushService.sendTest(user.id(), title, body);
    String status = result.delivered() > 0 ? "sent" : "failed";
    return new PushStatusResponse(
        status,
        result.subscriptions(),
        result.delivered(),
        result.failed(),
        result.message()
    );
  }
}
