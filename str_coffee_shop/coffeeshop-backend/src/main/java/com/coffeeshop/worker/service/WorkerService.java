package com.coffeeshop.worker.service;

import com.coffeeshop.auth.entity.Role;
import com.coffeeshop.auth.entity.User;
import com.coffeeshop.auth.exception.BusinessException;
import com.coffeeshop.auth.repository.UserRepository;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.repository.OrderRepository;
import com.coffeeshop.worker.dto.CreateWorkerRequest;
import com.coffeeshop.worker.dto.WorkerDTO;
import com.coffeeshop.worker.dto.ShiftStatusDTO;
import com.coffeeshop.worker.dto.WorkerReportDTO;
import com.coffeeshop.worker.dto.ShiftReportDTO;
import com.coffeeshop.worker.entity.WorkerShift;
import com.coffeeshop.worker.repository.WorkerShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkerService {

    private final UserRepository userRepository;
    private final WorkerShiftRepository workerShiftRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM yyyy");

    public List<WorkerDTO> getAllWorkers() {
        return userRepository.findByRole(Role.WORKER).stream()
                .map(this::mapToDTO)
                .toList();
    }

    public WorkerDTO createWorker(CreateWorkerRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getUsername() + "@coffeeshop.local");
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.WORKER);
        user.setEnabled(true);

        User savedUser = userRepository.save(user);
        return mapToDTO(savedUser);
    }

    public void deleteWorker(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Worker not found"));
        if (user.getRole() != Role.WORKER) {
            throw new BusinessException("Cannot delete non-worker user");
        }
        workerShiftRepository.deleteByWorkerId(id);
        userRepository.deleteById(id);
    }

    public ShiftStatusDTO getCurrentShift(String username) {
        User worker = getWorker(username);
        return workerShiftRepository.findFirstByWorkerIdAndCheckOutAtIsNullOrderByCheckInAtDesc(worker.getId())
                .map(shift -> new ShiftStatusDTO(true, shift.getCheckInAt(), null))
                .orElseGet(() -> workerShiftRepository.findFirstByWorkerIdOrderByCheckInAtDesc(worker.getId())
                        .map(shift -> new ShiftStatusDTO(false, shift.getCheckInAt(), shift.getCheckOutAt()))
                        .orElse(new ShiftStatusDTO(false, null, null)));
    }

    public ShiftStatusDTO checkIn(String username) {
        User worker = getWorker(username);
        var openShift = workerShiftRepository.findFirstByWorkerIdAndCheckOutAtIsNullOrderByCheckInAtDesc(worker.getId());
        if (openShift.isPresent()) {
            return new ShiftStatusDTO(true, openShift.get().getCheckInAt(), null);
        }
        WorkerShift shift = new WorkerShift();
        shift.setWorker(worker);
        shift.setCheckInAt(LocalDateTime.now());
        workerShiftRepository.save(shift);
        return new ShiftStatusDTO(true, shift.getCheckInAt(), null);
    }

    public ShiftStatusDTO checkOut(String username) {
        User worker = getWorker(username);
        WorkerShift shift = workerShiftRepository.findFirstByWorkerIdAndCheckOutAtIsNullOrderByCheckInAtDesc(worker.getId())
                .orElseThrow(() -> new RuntimeException("You are not checked in"));
        shift.setCheckOutAt(LocalDateTime.now());
        workerShiftRepository.save(shift);
        return new ShiftStatusDTO(false, shift.getCheckInAt(), shift.getCheckOutAt());
    }

    public List<WorkerReportDTO> getWorkerReports() {
        List<Order> orders = orderRepository.findAll();
        return userRepository.findByRole(Role.WORKER).stream()
                .map(worker -> {
                    String name = displayName(worker);
                    List<Order> workerOrders = orders.stream()
                            .filter(order -> name.equals(order.getWorkerName()))
                            .filter(order -> !"Cancelled".equalsIgnoreCase(order.getStatus()))
                            .toList();
                    BigDecimal salesTotal = workerOrders.stream()
                            .map(Order::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    var latestShift = workerShiftRepository.findFirstByWorkerIdOrderByCheckInAtDesc(worker.getId());
                    boolean checkedIn = workerShiftRepository.findFirstByWorkerIdAndCheckOutAtIsNullOrderByCheckInAtDesc(worker.getId()).isPresent();
                    return new WorkerReportDTO(
                            worker.getId(), name, worker.getUsername(),
                            checkedIn ? "Checked in" : "Off shift", joinedDate(worker),
                            latestShift.map(WorkerShift::getCheckInAt).orElse(null),
                            latestShift.map(WorkerShift::getCheckOutAt).orElse(null),
                            workerOrders.size(), salesTotal
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ShiftReportDTO> getShiftReports() {
        return workerShiftRepository.findAllByOrderByCheckInAtDesc().stream()
                .map(shift -> new ShiftReportDTO(
                        shift.getId(),
                        displayName(shift.getWorker()),
                        shift.getWorker().getUsername(),
                        shift.getCheckInAt(),
                        shift.getCheckOutAt()
                ))
                .toList();
    }

    @Transactional
    public long deleteShiftsOlderThanSevenDays() {
        return workerShiftRepository.deleteByCheckInAtBefore(LocalDateTime.now().minusDays(7));
    }

    private WorkerDTO mapToDTO(User user) {
        String displayName = displayName(user);
        String joinedDate = joinedDate(user);
        String status = workerShiftRepository.findFirstByWorkerIdAndCheckOutAtIsNullOrderByCheckInAtDesc(user.getId()).isPresent()
                ? "Checked in" : "Off shift";

        return new WorkerDTO(
                user.getId(),
                displayName,
                user.getUsername(),
                status,
                joinedDate
        );
    }

    private User getWorker(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        if (user.getRole() != Role.WORKER) throw new BusinessException("Only workers can use shifts");
        return user;
    }

    private String displayName(User user) {
        return user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getUsername();
    }

    private String joinedDate(User user) {
        return user.getCreatedAt() != null ? user.getCreatedAt().format(DATE_FORMATTER) : "Just now";
    }
}
