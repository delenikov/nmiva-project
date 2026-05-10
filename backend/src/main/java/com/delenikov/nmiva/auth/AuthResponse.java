package com.delenikov.nmiva.auth;

public record AuthResponse(
    String token,
    UserMeResponse user
) {}
