package com.delenikov.nmiva.sync;

import com.delenikov.nmiva.entry.EntryResponse;
import com.delenikov.nmiva.vehicle.VehicleResponse;
import java.time.Instant;
import java.util.List;

public record SyncResponse(
    Instant serverTime,
    List<SyncAck> acknowledgements,
    List<VehicleResponse> vehicles,
    List<EntryResponse> entries
) {}
