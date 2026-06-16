package com.ecom.userservice.controller;

import com.ecom.userservice.domain.model.Address;
import com.ecom.userservice.domain.model.UserPreferences;
import com.ecom.userservice.domain.model.UserProfile;
import com.ecom.userservice.dto.AddressDto;
import com.ecom.userservice.dto.UserPreferencesDto;
import com.ecom.userservice.dto.UserProfileDto;
import com.ecom.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfile> getUserProfile(@RequestHeader("X-User-Id") String userId) {
        UserProfile profile = userService.getProfile(UUID.fromString(userId));
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfile> updateUserProfile(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UserProfileDto dto) {
        UserProfile profile = userService.updateProfile(UUID.fromString(userId), dto);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<Address>> getUserAddresses(@RequestHeader("X-User-Id") String userId) {
        List<Address> addresses = userService.getAddresses(UUID.fromString(userId));
        return ResponseEntity.ok(addresses);
    }

    @PostMapping("/addresses")
    public ResponseEntity<Address> createAddress(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody AddressDto dto) {
        Address address = userService.createAddress(UUID.fromString(userId), dto);
        return ResponseEntity.ok(address);
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<Address> updateAddress(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable("id") UUID addressId,
            @Valid @RequestBody AddressDto dto) {
        Address address = userService.updateAddress(UUID.fromString(userId), addressId, dto);
        return ResponseEntity.ok(address);
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<String> deleteAddress(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable("id") UUID addressId) {
        userService.deleteAddress(UUID.fromString(userId), addressId);
        return ResponseEntity.ok("Address deleted successfully");
    }

    @GetMapping("/preferences")
    public ResponseEntity<UserPreferences> getUserPreferences(@RequestHeader("X-User-Id") String userId) {
        UserPreferences preferences = userService.getPreferences(UUID.fromString(userId));
        return ResponseEntity.ok(preferences);
    }

    @PutMapping("/preferences")
    public ResponseEntity<UserPreferences> updateUserPreferences(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UserPreferencesDto dto) {
        UserPreferences preferences = userService.updatePreferences(UUID.fromString(userId), dto);
        return ResponseEntity.ok(preferences);
    }
}
