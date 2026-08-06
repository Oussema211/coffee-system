package com.coffeeshop.worker.service;

import com.coffeeshop.auth.entity.Role;
import com.coffeeshop.auth.entity.User;
import com.coffeeshop.auth.repository.UserRepository;
import com.coffeeshop.worker.dto.CreateWorkerRequest;
import com.coffeeshop.worker.dto.WorkerDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkerService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM yyyy");

    public List<WorkerDTO> getAllWorkers() {
        return userRepository.findByRole(Role.WORKER).stream()
                .map(this::mapToDTO)
                .toList();
    }

    public WorkerDTO createWorker(CreateWorkerRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
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
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        if (user.getRole() != Role.WORKER) {
            throw new RuntimeException("Cannot delete non-worker user");
        }
        userRepository.deleteById(id);
    }

    private WorkerDTO mapToDTO(User user) {
        String displayName = user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : user.getUsername();

        String joinedDate = user.getCreatedAt() != null
                ? user.getCreatedAt().format(DATE_FORMATTER)
                : "Just now";

        String status = user.isEnabled() ? "Active" : "Off shift";

        return new WorkerDTO(
                user.getId(),
                displayName,
                user.getUsername(),
                status,
                joinedDate
        );
    }
}
