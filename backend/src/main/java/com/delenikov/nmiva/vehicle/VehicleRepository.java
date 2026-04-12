package com.delenikov.nmiva.vehicle;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
  List<Vehicle> findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(Long userId);

  List<Vehicle> findByUserIdAndLastModifiedAtAfterOrderByLastModifiedAtAsc(Long userId, Instant updatedAfter);

  List<Vehicle> findByUserIdOrderByLastModifiedAtAsc(Long userId);

  Optional<Vehicle> findByIdAndUserId(Long id, Long userId);
}
