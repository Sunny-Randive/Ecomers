package com.ecom.userservice.service;

import com.ecom.userservice.domain.model.Address;
import com.ecom.userservice.domain.model.UserPreferences;
import com.ecom.userservice.domain.model.UserProfile;
import com.ecom.userservice.dto.AddressDto;
import com.ecom.userservice.dto.UserPreferencesDto;
import com.ecom.userservice.dto.UserProfileDto;
import com.ecom.userservice.repository.AddressRepository;
import com.ecom.userservice.repository.UserPreferencesRepository;
import com.ecom.userservice.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserProfileRepository userProfileRepository;
    private final AddressRepository addressRepository;
    private final UserPreferencesRepository userPreferencesRepository;

    @Transactional
    public UserProfile getProfile(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseGet(() -> {
                    log.info("Initializing default user profile for user {}", userId);
                    UserProfile defaultProfile = UserProfile.builder()
                            .userId(userId)
                            .build();
                    return userProfileRepository.save(defaultProfile);
                });
    }

    @Transactional
    public UserProfile updateProfile(UUID userId, UserProfileDto dto) {
        UserProfile profile = getProfile(userId);
        profile.setFirstName(dto.getFirstName());
        profile.setLastName(dto.getLastName());
        profile.setPhoneNumber(dto.getPhoneNumber());
        return userProfileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public List<Address> getAddresses(UUID userId) {
        return addressRepository.findByUserId(userId);
    }

    @Transactional
    public Address createAddress(UUID userId, AddressDto dto) {
        if (dto.isDefault()) {
            resetDefaultAddresses(userId);
        }

        Address address = Address.builder()
                .userId(userId)
                .street(dto.getStreet())
                .city(dto.getCity())
                .state(dto.getState())
                .zipCode(dto.getZipCode())
                .country(dto.getCountry())
                .isDefault(dto.isDefault())
                .build();

        return addressRepository.save(address);
    }

    @Transactional
    public Address updateAddress(UUID userId, UUID addressId, AddressDto dto) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));

        if (!address.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to modify this address");
        }

        if (dto.isDefault() && !address.isDefault()) {
            resetDefaultAddresses(userId);
        }

        address.setStreet(dto.getStreet());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setZipCode(dto.getZipCode());
        address.setCountry(dto.getCountry());
        address.setDefault(dto.isDefault());

        return addressRepository.save(address);
    }

    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));

        if (!address.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to delete this address");
        }

        addressRepository.delete(address);
    }

    @Transactional
    public UserPreferences getPreferences(UUID userId) {
        return userPreferencesRepository.findById(userId)
                .orElseGet(() -> {
                    log.info("Initializing default preferences for user {}", userId);
                    UserPreferences defaultPreferences = UserPreferences.builder()
                            .userId(userId)
                            .preferredCurrency("USD")
                            .preferredLanguage("en")
                            .build();
                    return userPreferencesRepository.save(defaultPreferences);
                });
    }

    @Transactional
    public UserPreferences updatePreferences(UUID userId, UserPreferencesDto dto) {
        UserPreferences preferences = getPreferences(userId);
        if (dto.getPreferredCurrency() != null) {
            preferences.setPreferredCurrency(dto.getPreferredCurrency());
        }
        if (dto.getPreferredLanguage() != null) {
            preferences.setPreferredLanguage(dto.getPreferredLanguage());
        }
        return userPreferencesRepository.save(preferences);
    }

    private void resetDefaultAddresses(UUID userId) {
        List<Address> addresses = addressRepository.findByUserId(userId);
        addresses.forEach(addr -> {
            if (addr.isDefault()) {
                addr.setDefault(false);
                addressRepository.save(addr);
            }
        });
    }
}
