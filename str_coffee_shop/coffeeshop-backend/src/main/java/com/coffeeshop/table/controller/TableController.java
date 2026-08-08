package com.coffeeshop.table.controller;

import com.coffeeshop.table.dto.CreateTableRequest;
import com.coffeeshop.table.dto.TableDTO;
import com.coffeeshop.table.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class TableController {

    private final TableService tableService;

    // ── Admin endpoints ──────────────────────────────────────────────────────────

    @GetMapping("/api/admin/tables")
    public ResponseEntity<List<TableDTO>> getAllTablesAdmin() {
        return ResponseEntity.ok(tableService.getAllTables());
    }

    @PostMapping("/api/admin/tables")
    public ResponseEntity<?> createTable(@Valid @RequestBody CreateTableRequest request) {
        try {
            TableDTO created = tableService.createTable(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/admin/tables/{id}")
    public ResponseEntity<?> deleteTable(@PathVariable Long id) {
        try {
            tableService.deleteTable(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Worker endpoints ─────────────────────────────────────────────────────────

    @GetMapping("/api/worker/tables")
    public ResponseEntity<List<TableDTO>> getAllTablesWorker() {
        return ResponseEntity.ok(tableService.getAllTables());
    }

    @PatchMapping("/api/worker/tables/{id}/status")
    public ResponseEntity<?> updateTableStatusWorker(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null || status.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            TableDTO updated = tableService.updateTableStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
