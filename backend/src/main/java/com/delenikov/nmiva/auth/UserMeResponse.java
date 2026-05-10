package com.delenikov.nmiva.auth;

public record UserMeResponse(
    Long id,
    String email,
    String displayName
) {}
