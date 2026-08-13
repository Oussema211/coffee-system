package com.coffeeshop.menu.controller;

import com.coffeeshop.menu.dto.CreateMenuItemRequest;
import com.coffeeshop.menu.dto.MenuItemDTO;
import com.coffeeshop.menu.dto.UpdateMenuItemRequest;
import com.coffeeshop.menu.service.MenuItemService;
import com.coffeeshop.util.ImageUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class MenuItemController {

    private static final Logger log = LoggerFactory.getLogger(MenuItemController.class);

    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

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
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image must be 5MB or smaller"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only JPG, PNG or WEBP images are allowed"));
        }

        String extension = resolveExtension(file.getOriginalFilename());
        if (extension == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "File must have a .jpg, .png or .webp extension"));
        }

        String filename = UUID.randomUUID() + "." + extension;
        Path uploadPath = Paths.get("uploads/menu");

        try {
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            String fileUrl = ImageUtils.resolveImageUrl("/uploads/menu/" + filename);
            return ResponseEntity.ok(Map.of("imageUrl", fileUrl));
        } catch (IOException e) {
            log.error("Failed to save uploaded image {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image"));
        }
    }

    private String resolveExtension(String originalFilename) {
        if (originalFilename == null) {
            return null;
        }
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
            return null;
        }
        String extension = originalFilename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        return ALLOWED_EXTENSIONS.contains(extension) ? extension : null;
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
