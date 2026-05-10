package com.delenikov.nmiva.sync;

public record SyncAck(
    String entityType,
    String localId,
    Long serverId,
    String status,
    String message
) {}
