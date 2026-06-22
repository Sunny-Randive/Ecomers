package com.ecom.cartservice.listener;

import com.ecom.cartservice.repository.CartItemRepository;
import com.ecom.common.event.ProductDeletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductEventListener {

    private final CartItemRepository cartItemRepository;

    @KafkaListener(topics = "product-events", groupId = "cart-group")
    @Transactional
    public void handleProductDeletedEvent(ProductDeletedEvent event) {
        log.info("Received ProductDeletedEvent for productId: {}", event.getProductId());
        try {
            cartItemRepository.deleteByProductId(event.getProductId());
            log.info("Successfully removed orphaned cart items for productId: {}", event.getProductId());
        } catch (Exception e) {
            log.error("Error removing orphaned cart items for productId: {}", event.getProductId(), e);
        }
    }
}
