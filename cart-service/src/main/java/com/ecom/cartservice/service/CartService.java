package com.ecom.cartservice.service;

import com.ecom.cartservice.domain.model.CartItem;
import com.ecom.cartservice.dto.CartDto;
import com.ecom.cartservice.dto.CartItemDto;
import com.ecom.cartservice.repository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartItemRepository cartItemRepository;

    @Transactional(readOnly = true)
    public CartDto getCart(UUID userId) {
        log.info("Fetching cart for user {}", userId);
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        List<CartItemDto> itemDtos = items.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return CartDto.builder()
                .userId(userId)
                .items(itemDtos)
                .build();
    }

    @Transactional
    public CartDto addItemToCart(UUID userId, CartItemDto dto) {
        log.info("Adding product {} to cart for user {}", dto.getProductId(), userId);
        
        cartItemRepository.findByUserIdAndProductId(userId, dto.getProductId())
                .ifPresentOrElse(
                        existingItem -> {
                            existingItem.setQuantity(existingItem.getQuantity() + dto.getQuantity());
                            cartItemRepository.save(existingItem);
                        },
                        () -> {
                            CartItem newItem = CartItem.builder()
                                    .userId(userId)
                                    .productId(dto.getProductId())
                                    .quantity(dto.getQuantity())
                                    .build();
                            cartItemRepository.save(newItem);
                        }
                );

        return getCart(userId);
    }

    @Transactional
    public CartDto updateQuantity(UUID userId, UUID itemId, Integer quantity) {
        log.info("Updating quantity for cart item {} to {}", itemId, quantity);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (!item.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to modify this cart item");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);
        return getCart(userId);
    }

    @Transactional
    public CartDto removeItemFromCart(UUID userId, UUID itemId) {
        log.info("Removing cart item {} for user {}", itemId, userId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (!item.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to delete this cart item");
        }

        cartItemRepository.delete(item);
        return getCart(userId);
    }

    @Transactional
    public void clearCart(UUID userId) {
        log.info("Clearing cart for user {}", userId);
        cartItemRepository.deleteByUserId(userId);
    }

    private CartItemDto mapToDto(CartItem item) {
        return CartItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .quantity(item.getQuantity())
                .build();
    }
}
