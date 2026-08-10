package com.coffeeshop.menu.controller;

import com.coffeeshop.menu.dto.CreateMenuItemRequest;
import com.coffeeshop.menu.dto.MenuItemDTO;
import com.coffeeshop.menu.dto.UpdateMenuItemRequest;
import com.coffeeshop.menu.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class MenuItemController {

    private final MenuItemService menuItemService;

    // ── Admin endpoints ──────────────────────────────────────────────────────────

    @GetMapping("/api/admin/menu")
    public ResponseEntity<List<MenuItemDTO>> getAllMenuItemsAdmin() {
        return ResponseEntity.ok(menuItemService.getAllMenuItems());
    }

    @GetMapping("/api/admin/menu/{id}")
    public ResponseEntity<MenuItemDTO> getMenuItemById(@PathVariable Long id) {
        return ResponseEntity.ok(menuItemService.getMenuItemById(id));
    }

    @PostMapping("/api/admin/menu")
    public ResponseEntity<MenuItemDTO> createMenuItem(@Valid @RequestBody CreateMenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.createMenuItem(request));
    }

    @PutMapping("/api/admin/menu/{id}")
    public ResponseEntity<MenuItemDTO> updateMenuItem(@PathVariable Long id, @Valid @RequestBody UpdateMenuItemRequest request) {
        return ResponseEntity.ok(menuItemService.updateMenuItem(id, request));
    }

    @PostMapping("/api/admin/menu/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "File is empty"));
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            } else {
                extension = ".jpg";
            }

            String filename = java.util.UUID.randomUUID().toString() + extension;
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads/menu");

            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            java.nio.file.Path filePath = uploadPath.resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "http://localhost:8080/uploads/menu/" + filename;
            return ResponseEntity.ok(java.util.Map.of("imageUrl", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    @DeleteMapping("/api/admin/menu/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        menuItemService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }

    // ── Worker endpoint (read-only) ───────────────────────────────────────────────

    @GetMapping("/api/worker/menu")
    public ResponseEntity<List<MenuItemDTO>> getAllMenuItemsWorker() {
        return ResponseEntity.ok(menuItemService.getAllMenuItems());
    }

    @PatchMapping("/api/worker/menu/{id}/toggle")
    public ResponseEntity<MenuItemDTO> toggleAvailabilityForWorker(@PathVariable Long id) {
        return ResponseEntity.ok(menuItemService.toggleAvailability(id));
    }
}
