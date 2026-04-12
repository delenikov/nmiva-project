package com.delenikov.nmiva.sync;

import com.delenikov.nmiva.entry.Entry;
import com.delenikov.nmiva.entry.EntryDtos;
import com.delenikov.nmiva.entry.EntryService;
import com.delenikov.nmiva.entry.SyncStatus;
import com.delenikov.nmiva.vehicle.Vehicle;
import com.delenikov.nmiva.vehicle.VehicleDtos;
import com.delenikov.nmiva.vehicle.VehicleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncService {
  private final VehicleService vehicleService;
  private final EntryService entryService;
  private final ObjectMapper objectMapper;

  @Transactional
  public SyncDtos.SyncResponse sync(Long userId, SyncDtos.SyncRequest request) {
    List<SyncDtos.SyncAck> acknowledgements = new ArrayList<>();
    for (SyncDtos.ChangeRecord change : safe(request.vehicleChanges())) {
      acknowledgements.add(handleVehicleChange(userId, change));
    }
    for (SyncDtos.ChangeRecord change : safe(request.entryChanges())) {
      acknowledgements.add(handleEntryChange(userId, change));
    }

    List<VehicleDtos.VehicleResponse> vehicles = vehicleService.changesSince(userId, request.lastPulledAt()).stream()
        .map(vehicleService::toResponse)
        .toList();
    List<EntryDtos.EntryResponse> entries = entryService.changesSince(userId, request.lastPulledAt()).stream()
        .map(entryService::toResponse)
        .toList();

    return new SyncDtos.SyncResponse(Instant.now(), acknowledgements, vehicles, entries);
  }

  private SyncDtos.SyncAck handleVehicleChange(Long userId, SyncDtos.ChangeRecord change) {
    try {
      return switch (change.operation()) {
        case CREATE -> createVehicle(userId, change);
        case UPDATE -> updateVehicle(userId, change);
        case DELETE -> deleteVehicle(userId, change);
      };
    } catch (Exception ex) {
      log.warn("Vehicle sync failed for localId {}: {}", change.localId(), ex.getMessage());
      return new SyncDtos.SyncAck("vehicle", change.localId(), change.serverId(), "failed", ex.getMessage());
    }
  }

  private SyncDtos.SyncAck handleEntryChange(Long userId, SyncDtos.ChangeRecord change) {
    try {
      return switch (change.operation()) {
        case CREATE -> createEntry(userId, change);
        case UPDATE -> updateEntry(userId, change);
        case DELETE -> deleteEntry(userId, change);
      };
    } catch (Exception ex) {
      log.warn("Entry sync failed for localId {}: {}", change.localId(), ex.getMessage());
      return new SyncDtos.SyncAck("entry", change.localId(), change.serverId(), "failed", ex.getMessage());
    }
  }

  private SyncDtos.SyncAck createVehicle(Long userId, SyncDtos.ChangeRecord change) {
    SyncDtos.VehiclePayload payload = parse(change, SyncDtos.VehiclePayload.class);
    Vehicle vehicle = new Vehicle();
    vehicle.setUserId(userId);
    applyVehiclePayload(vehicle, payload);
    if (Boolean.TRUE.equals(payload.deleted())) {
      vehicle.setDeleted(true);
    }
    if (change.lastModifiedAt() != null) {
      vehicle.setLastModifiedAt(change.lastModifiedAt());
    }
    Vehicle saved = vehicleService.save(vehicle);
    return new SyncDtos.SyncAck("vehicle", change.localId(), saved.getId(), "synced", "created");
  }

  private SyncDtos.SyncAck updateVehicle(Long userId, SyncDtos.ChangeRecord change) {
    if (change.serverId() == null) {
      return new SyncDtos.SyncAck("vehicle", change.localId(), null, "failed", "serverId is required for update");
    }
    Vehicle vehicle = vehicleService.getOwned(change.serverId(), userId);
    if (hasConflict(vehicle.getLastModifiedAt(), change.lastModifiedAt())) {
      return new SyncDtos.SyncAck("vehicle", change.localId(), vehicle.getId(), "conflict", "server has newer data");
    }
    SyncDtos.VehiclePayload payload = parse(change, SyncDtos.VehiclePayload.class);
    applyVehiclePayload(vehicle, payload);
    if (Boolean.TRUE.equals(payload.deleted())) {
      vehicle.setDeleted(true);
    }
    if (change.lastModifiedAt() != null) {
      vehicle.setLastModifiedAt(change.lastModifiedAt());
    }
    Vehicle saved = vehicleService.save(vehicle);
    return new SyncDtos.SyncAck("vehicle", change.localId(), saved.getId(), "synced", "updated");
  }

  private SyncDtos.SyncAck deleteVehicle(Long userId, SyncDtos.ChangeRecord change) {
    if (change.serverId() == null) {
      return new SyncDtos.SyncAck("vehicle", change.localId(), null, "failed", "serverId is required for delete");
    }
    Vehicle vehicle = vehicleService.getOwned(change.serverId(), userId);
    if (hasConflict(vehicle.getLastModifiedAt(), change.lastModifiedAt())) {
      return new SyncDtos.SyncAck("vehicle", change.localId(), vehicle.getId(), "conflict", "server has newer data");
    }
    vehicle.setDeleted(true);
    vehicle.setLastModifiedAt(change.lastModifiedAt() == null ? Instant.now() : change.lastModifiedAt());
    vehicleService.save(vehicle);
    return new SyncDtos.SyncAck("vehicle", change.localId(), vehicle.getId(), "synced", "deleted");
  }

  private SyncDtos.SyncAck createEntry(Long userId, SyncDtos.ChangeRecord change) {
    SyncDtos.EntryPayload payload = parse(change, SyncDtos.EntryPayload.class);
    Vehicle vehicle = vehicleService.getOwned(payload.vehicleId(), userId);
    Entry entry = new Entry();
    entry.setUserId(userId);
    entry.setVehicleId(vehicle.getId());
    entry.setDeleted(Boolean.TRUE.equals(payload.deleted()));
    entryService.apply(entry, toEntryRequest(payload));
    entry.setSyncStatus(SyncStatus.SYNCED);
    if (change.lastModifiedAt() != null) {
      entry.setLastModifiedAt(change.lastModifiedAt());
    }
    Entry saved = entryService.save(entry);
    return new SyncDtos.SyncAck("entry", change.localId(), saved.getId(), "synced", "created");
  }

  private SyncDtos.SyncAck updateEntry(Long userId, SyncDtos.ChangeRecord change) {
    if (change.serverId() == null) {
      return new SyncDtos.SyncAck("entry", change.localId(), null, "failed", "serverId is required for update");
    }
    Entry entry = entryService.getOwned(change.serverId(), userId);
    if (hasConflict(entry.getLastModifiedAt(), change.lastModifiedAt())) {
      return new SyncDtos.SyncAck("entry", change.localId(), entry.getId(), "conflict", "server has newer data");
    }
    SyncDtos.EntryPayload payload = parse(change, SyncDtos.EntryPayload.class);
    vehicleService.getOwned(payload.vehicleId(), userId);
    entry.setVehicleId(payload.vehicleId());
    entryService.apply(entry, toEntryRequest(payload));
    entry.setDeleted(Boolean.TRUE.equals(payload.deleted()));
    entry.setSyncStatus(SyncStatus.SYNCED);
    if (change.lastModifiedAt() != null) {
      entry.setLastModifiedAt(change.lastModifiedAt());
    }
    Entry saved = entryService.save(entry);
    return new SyncDtos.SyncAck("entry", change.localId(), saved.getId(), "synced", "updated");
  }

  private SyncDtos.SyncAck deleteEntry(Long userId, SyncDtos.ChangeRecord change) {
    if (change.serverId() == null) {
      return new SyncDtos.SyncAck("entry", change.localId(), null, "failed", "serverId is required for delete");
    }
    Entry entry = entryService.getOwned(change.serverId(), userId);
    if (hasConflict(entry.getLastModifiedAt(), change.lastModifiedAt())) {
      return new SyncDtos.SyncAck("entry", change.localId(), entry.getId(), "conflict", "server has newer data");
    }
    entry.setDeleted(true);
    entry.setSyncStatus(SyncStatus.SYNCED);
    entry.setLastModifiedAt(change.lastModifiedAt() == null ? Instant.now() : change.lastModifiedAt());
    entryService.save(entry);
    return new SyncDtos.SyncAck("entry", change.localId(), entry.getId(), "synced", "deleted");
  }

  private void applyVehiclePayload(Vehicle vehicle, SyncDtos.VehiclePayload payload) {
    VehicleDtos.VehicleRequest request = new VehicleDtos.VehicleRequest(
        payload.brand(),
        payload.model(),
        payload.year(),
        payload.fuelType(),
        payload.odometerStart()
    );
    vehicleService.apply(vehicle, request);
  }

  private EntryDtos.EntryRequest toEntryRequest(SyncDtos.EntryPayload payload) {
    return new EntryDtos.EntryRequest(
        payload.type(),
        payload.date(),
        payload.title(),
        payload.notes(),
        payload.odometer(),
        payload.cost(),
        payload.liters(),
        payload.pricePerLiter(),
        payload.isFullTank(),
        payload.serviceCategory(),
        payload.expenseCategory(),
        payload.dueDate(),
        payload.repeatYearly(),
        payload.completed()
    );
  }

  private boolean hasConflict(Instant server, Instant client) {
    return client != null && server != null && server.isAfter(client);
  }

  private <T> T parse(SyncDtos.ChangeRecord change, Class<T> type) {
    if (change.payload() == null) {
      throw new IllegalArgumentException("Payload is required for " + change.operation());
    }
    return objectMapper.convertValue(change.payload(), type);
  }

  private <T> List<T> safe(List<T> list) {
    return list == null ? List.of() : list;
  }
}
