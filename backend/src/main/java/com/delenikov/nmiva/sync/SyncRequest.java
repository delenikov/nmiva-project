package com.delenikov.nmiva.sync;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;

public record SyncRequest(
    Instant lastPulledAt,
    @Valid List<ChangeRecord> vehicleChanges,
    @Valid List<ChangeRecord> entryChanges
) {}
