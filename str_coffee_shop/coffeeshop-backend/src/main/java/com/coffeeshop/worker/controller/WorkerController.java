package com.coffeeshop.worker.controller;

import com.coffeeshop.worker.dto.CreateWorkerRequest;
import com.coffeeshop.worker.dto.WorkerDTO;
import com.coffeeshop.worker.service.WorkerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/workers")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class WorkerController {

    private final WorkerService workerService;

    @GetMapping
    public ResponseEntity<List<WorkerDTO>> getAllWorkers() {
        return ResponseEntity.ok(workerService.getAllWorkers());
    }

    @PostMapping
    public ResponseEntity<WorkerDTO> createWorker(@Valid @RequestBody CreateWorkerRequest request) {
        return ResponseEntity.ok(workerService.createWorker(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorker(@PathVariable Long id) {
        workerService.deleteWorker(id);
        return ResponseEntity.noContent().build();
    }
}
