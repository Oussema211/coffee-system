package com.coffeeshop.worker.repository;

import com.coffeeshop.worker.entity.WorkerShift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.time.LocalDateTime;
import java.util.List;

public interface WorkerShiftRepository extends JpaRepository<WorkerShift, Long> {
    Optional<WorkerShift> findFirstByWorkerIdAndCheckOutAtIsNullOrderByCheckInAtDesc(Long workerId);
    Optional<WorkerShift> findFirstByWorkerIdOrderByCheckInAtDesc(Long workerId);
    void deleteByWorkerId(Long workerId);
    List<WorkerShift> findAllByOrderByCheckInAtDesc();
    long deleteByCheckInAtBefore(LocalDateTime cutoff);
}
