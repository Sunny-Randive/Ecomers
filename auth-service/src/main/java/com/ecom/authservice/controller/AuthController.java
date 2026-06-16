package com.ecom.authservice.controller;

import com.ecom.authservice.config.JwtUtils;
import com.ecom.authservice.domain.model.User;
import com.ecom.authservice.dto.*;
import com.ecom.authservice.service.AuthService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = authService.register(registerRequest);
        return ResponseEntity.ok("User registered successfully with ID: " + user.getId());
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        TokenResponse tokenResponse = authService.login(loginRequest);
        return ResponseEntity.ok(tokenResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest refreshRequest) {
        TokenResponse tokenResponse = authService.refreshToken(refreshRequest.getRefreshToken());
        return ResponseEntity.ok(tokenResponse);
    }

    @GetMapping("/validate")
    @SuppressWarnings("unchecked")
    public ResponseEntity<TokenValidationResponse> validateToken(@RequestParam("token") String token) {
        boolean valid = jwtUtils.validateToken(token);
        if (valid) {
            Claims claims = jwtUtils.getClaimsFromToken(token);
            String username = claims.getSubject();
            String userId = claims.get("userId", String.class);
            List<String> roles = claims.get("roles", List.class);
            return ResponseEntity.ok(TokenValidationResponse.builder()
                    .valid(true)
                    .username(username)
                    .userId(userId)
                    .roles(roles)
                    .build());
        }
        return ResponseEntity.ok(TokenValidationResponse.builder().valid(false).build());
    }
}
