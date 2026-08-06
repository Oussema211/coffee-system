package com.coffeeshop.controller;

import com.coffeeshop.dto.AuthRequest;
import com.coffeeshop.dto.AuthResponse;
import com.coffeeshop.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        // For simplicity, default role is WORKER
        return ResponseEntity.ok(authService.register(request, "WORKER"));
    }

    @PostMapping("/register/admin")
    public ResponseEntity<AuthResponse> registerAdmin(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.register(request, "ADMIN"));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // JWT is stateless, client should discard the token
        return ResponseEntity.ok("Logged out successfully");
    }
}