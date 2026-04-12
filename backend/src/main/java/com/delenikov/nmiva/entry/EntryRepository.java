package com.delenikov.nmiva.entry;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntryRepository extends JpaRepository<Entry, Long> {

  List<Entry> findByUserIdAndVehicleIdAndDeletedFalseOrderByDateDescCreatedAtDesc(Long userId, Long vehicleId);

  List<Entry> findByUserIdAndVehicleIdAndTypeAndDeletedFalseOrderByDateDescCreatedAtDesc(
      Long userId,
      Long vehicleId,
      EntryType type
  );

  Optional<Entry> findByIdAndUserId(Long id, Long userId);

  List<Entry> findByUserIdAndVehicleIdAndTypeAndDeletedFalseAndIsFullTankTrueAndOdometerIsNotNullAndLitersIsNotNullOrderByDateAscCreatedAtAsc(
      Long userId,
      Long vehicleId,
      EntryType type
  );

  List<Entry> findByUserIdAndTypeAndDeletedFalseAndCompletedFalse(Long userId, EntryType type);

  List<Entry> findByUserIdAndTypeAndDeletedFalseAndCompletedFalseAndDueDateBetween(
      Long userId,
      EntryType type,
      LocalDate start,
      LocalDate end
  );

  List<Entry> findByUserIdAndTypeAndDeletedFalseAndCompletedFalseAndDueDateBefore(
      Long userId,
      EntryType type,
      LocalDate before
  );

  List<Entry> findByUserIdAndLastModifiedAtAfterOrderByLastModifiedAtAsc(Long userId, Instant lastPulledAt);

  List<Entry> findByUserIdOrderByLastModifiedAtAsc(Long userId);

  List<Entry> findByUserIdAndTypeAndDeletedFalseAndCompletedFalseAndDueDateLessThanEqual(
      Long userId,
      EntryType type,
      LocalDate date
  );

  List<Entry> findByTypeAndDeletedFalseAndCompletedFalse(EntryType type);
}
