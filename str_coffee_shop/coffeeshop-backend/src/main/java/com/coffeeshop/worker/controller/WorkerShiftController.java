package com.coffeeshop.worker.controller;

import com.coffeeshop.worker.dto.ShiftStatusDTO;
import com.coffeeshop.worker.service.WorkerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/worker/shift")
@RequiredArgsConstructor
public class WorkerShiftController {
    private final WorkerService workerService;

    @GetMapping
    public ResponseEntity<ShiftStatusDTO> getCurrentShift(Authentication authentication) {
        return ResponseEntity.ok(workerService.getCurrentShift(authentication.getName()));
    }

    @PostMapping("/check-in")
    public ResponseEntity<ShiftStatusDTO> checkIn(Authentication authentication) {
        return ResponseEntity.ok(workerService.checkIn(authentication.getName()));
    }

    @PostMapping("/check-out")
    public ResponseEntity<ShiftStatusDTO> checkOut(Authentication authentication) {
        return ResponseEntity.ok(workerService.checkOut(authentication.getName()));
    }
}
