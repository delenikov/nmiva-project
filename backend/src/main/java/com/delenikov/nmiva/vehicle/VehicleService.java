package com.delenikov.nmiva.vehicle;

import com.delenikov.nmiva.common.ApiException;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VehicleService {
  private final VehicleRepository vehicleRepository;

  @Transactional(readOnly = true)
  public List<VehicleResponse> list(Long userId) {
    return vehicleRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(userId)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public Vehicle getOwned(Long id, Long userId) {
    return vehicleRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found"));
  }

  @Transactional
  public VehicleResponse create(Long userId, VehicleRequest request) {
    Vehicle vehicle = new Vehicle();
    apply(vehicle, request);
    vehicle.setUserId(userId);
    vehicle.setDeleted(false);
    vehicle.setLastModifiedAt(Instant.now());
    return toResponse(vehicleRepository.save(vehicle));
  }

  @Transactional
  public VehicleResponse update(Long id, Long userId, VehicleRequest request) {
    Vehicle vehicle = getOwned(id, userId);
    apply(vehicle, request);
    vehicle.setLastModifiedAt(Instant.now());
    return toResponse(vehicleRepository.save(vehicle));
  }

  @Transactional
  public void delete(Long id, Long userId) {
    Vehicle vehicle = getOwned(id, userId);
    vehicle.setDeleted(true);
    vehicle.setLastModifiedAt(Instant.now());
    vehicleRepository.save(vehicle);
  }

  @Transactional(readOnly = true)
  public List<Vehicle> changesSince(Long userId, Instant lastPulledAt) {
    if (lastPulledAt == null) {
      return vehicleRepository.findByUserIdOrderByLastModifiedAtAsc(userId);
    }
    return vehicleRepository.findByUserIdAndLastModifiedAtAfterOrderByLastModifiedAtAsc(userId, lastPulledAt);
  }

  public VehicleResponse toResponse(Vehicle vehicle) {
    return new VehicleResponse(
        vehicle.getId(),
        vehicle.getUserId(),
        vehicle.getBrand(),
        vehicle.getModel(),
        vehicle.getYear(),
        vehicle.getFuelType().name().toLowerCase(),
        vehicle.getOdometerStart(),
        vehicle.isDeleted(),
        vehicle.getCreatedAt(),
        vehicle.getUpdatedAt(),
        vehicle.getLastModifiedAt()
    );
  }

  public void apply(Vehicle vehicle, VehicleRequest request) {
    vehicle.setBrand(request.brand().trim());
    vehicle.setModel(request.model().trim());
    vehicle.setYear(request.year());
    vehicle.setFuelType(FuelType.from(request.fuelType()));
    vehicle.setOdometerStart(request.odometerStart());
  }

  @Transactional
  public Vehicle save(Vehicle vehicle) {
    return vehicleRepository.save(vehicle);
  }
}
