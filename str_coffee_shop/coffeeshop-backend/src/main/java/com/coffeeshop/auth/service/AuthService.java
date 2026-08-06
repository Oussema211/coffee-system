package com.coffeeshop.auth.service;

import com.coffeeshop.auth.config.JwtService;
import com.coffeeshop.auth.dto.AuthRequest;
import com.coffeeshop.auth.dto.AuthResponse;
import com.coffeeshop.auth.entity.Role;
import com.coffeeshop.auth.entity.User;
import com.coffeeshop.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getUsername(), user.getRole().name(), user.getId());
    }

    public AuthResponse register(AuthRequest request, String role) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getUsername() + "@example.com");
        user.setRole(Role.valueOf(role));
        user.setEnabled(true);

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);

        return new AuthResponse(token, savedUser.getUsername(), savedUser.getRole().name(), savedUser.getId());
    }
}