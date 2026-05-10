package com.delenikov.nmiva.sync;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;

public record ChangeRecord(
    String localId,
    Long serverId,
    @NotNull SyncOperation operation,
    Instant lastModifiedAt,
    Map<String, Object> payload
) {}
