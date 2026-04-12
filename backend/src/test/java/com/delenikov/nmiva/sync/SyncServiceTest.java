package com.delenikov.nmiva.sync;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.delenikov.nmiva.entry.EntryService;
import com.delenikov.nmiva.vehicle.Vehicle;
import com.delenikov.nmiva.vehicle.VehicleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

  @Mock
  private VehicleService vehicleService;
  @Mock
  private EntryService entryService;
  @Mock
  private ObjectMapper objectMapper;

  private SyncService syncService;

  @BeforeEach
  void setUp() {
    syncService = new SyncService(vehicleService, entryService, objectMapper);
  }

  @Test
  void returnsConflictWhenServerVehicleIsNewer() {
    Vehicle existing = new Vehicle();
    existing.setId(7L);
    existing.setUserId(1L);
    existing.setBrand("VW");
    existing.setModel("Golf");
    existing.setYear(2019);
    existing.setFuelType(com.delenikov.nmiva.vehicle.FuelType.DIESEL);
    existing.setOdometerStart(BigDecimal.valueOf(100000));
    existing.setLastModifiedAt(Instant.parse("2026-04-12T10:00:00Z"));

    SyncDtos.ChangeRecord change = new SyncDtos.ChangeRecord(
        "vehicle-local-1",
        7L,
        SyncOperation.UPDATE,
        Instant.parse("2026-04-12T09:00:00Z"),
        null
    );

    when(vehicleService.getOwned(7L, 1L)).thenReturn(existing);
    when(vehicleService.changesSince(1L, null)).thenReturn(List.of());
    when(entryService.changesSince(1L, null)).thenReturn(List.of());

    SyncDtos.SyncResponse response = syncService.sync(
        1L,
        new SyncDtos.SyncRequest(null, List.of(change), List.of())
    );

    assertThat(response.acknowledgements()).hasSize(1);
    assertThat(response.acknowledgements().getFirst().status()).isEqualTo("conflict");
    verify(vehicleService).getOwned(7L, 1L);
  }
}
