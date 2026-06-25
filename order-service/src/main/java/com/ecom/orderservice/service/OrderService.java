package com.ecom.orderservice.service;

import com.ecom.common.event.OrderCancelledEvent;
import com.ecom.common.event.OrderCreatedEvent;
import com.ecom.orderservice.domain.model.Order;
import com.ecom.orderservice.domain.model.OrderItem;
import com.ecom.orderservice.dto.OrderResponseDto;
import com.ecom.orderservice.dto.PlaceOrderRequest;
import com.ecom.orderservice.dto.client.CartDto;
import com.ecom.orderservice.dto.client.CartItemDto;
import com.ecom.orderservice.dto.client.ProductDto;
import com.ecom.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.ecom.orderservice.client.CartClient;
import com.ecom.orderservice.client.ProductClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartClient cartClient;
    private final ProductClient productClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    @CircuitBreaker(name = "cartClient", fallbackMethod = "checkoutFallback")
    public OrderResponseDto checkout(UUID userId, PlaceOrderRequest request) {
        log.info("Initiating checkout saga for user {}", userId);

        // 1. Fetch Cart contents from Cart Service via Feign Client
        CartDto cartDto = cartClient.getCart(userId.toString());
        if (cartDto == null || cartDto.getItems() == null || cartDto.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot place order. User cart is empty");
        }

        // 2. Fetch prices from Product Service via Feign Client & build OrderItems
        BigDecimal totalAmount = BigDecimal.ZERO;
        Order order = Order.builder()
                .userId(userId)
                .status("PENDING")
                .paymentMethod(request.getPaymentMethod())
                .totalAmount(BigDecimal.ZERO)
                .build();

        List<OrderItem> orderItems = new ArrayList<>();
        List<OrderCreatedEvent.OrderItemEvent> eventItems = new ArrayList<>();

        for (CartItemDto cartItem : cartDto.getItems()) {
            // Fetch product price to prevent price injection
            ProductDto productDto = productClient.getProductById(cartItem.getProductId());

            if (productDto == null) {
                throw new IllegalArgumentException("Product not found: " + cartItem.getProductId());
            }

            BigDecimal itemPrice = productDto.getPrice();
            BigDecimal itemTotal = itemPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            orderItems.add(OrderItem.builder()
                    .order(order)
                    .productId(cartItem.getProductId())
                    .quantity(cartItem.getQuantity())
                    .price(itemPrice)
                    .build());

            eventItems.add(OrderCreatedEvent.OrderItemEvent.builder()
                    .productId(cartItem.getProductId())
                    .quantity(cartItem.getQuantity())
                    .price(itemPrice)
                    .build());
        }

        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);
        log.info("Saved order {} in PENDING state", savedOrder.getId());

        // 3. Clear the user's cart in Cart Service via Feign Client
        cartClient.clearCart(userId.toString());

        // 4. Publish OrderCreatedEvent to Kafka
        OrderCreatedEvent orderCreatedEvent = OrderCreatedEvent.builder()
                .orderId(savedOrder.getId())
                .userId(userId)
                .totalAmount(totalAmount)
                .items(eventItems)
                .build();

        kafkaTemplate.send("order-created-topic", savedOrder.getId().toString(), orderCreatedEvent);
        log.info("Published OrderCreatedEvent for order {}", savedOrder.getId());

        return mapToResponseDto(savedOrder);
    }

    public OrderResponseDto checkoutFallback(UUID userId, PlaceOrderRequest request, Throwable t) {
        log.error("Checkout circuit breaker fallback triggered for user {}. Reason: {}", userId, t.getMessage());
        throw new IllegalStateException("Unable to complete checkout at this time. Cart or Product service may be unavailable.", t);
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderDetails(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to view this order");
        }

        return mapToResponseDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getUserOrders(UUID userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return orders.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponseDto updateOrderStatus(UUID orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        String newStatus = status.toUpperCase();
        order.setStatus(newStatus);
        if ("DELIVERED".equals(newStatus)) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        Order savedOrder = orderRepository.save(order);
        log.info("Updated status of order {} to {}", orderId, status);
        return mapToResponseDto(savedOrder);
    }


    @Transactional
    public OrderResponseDto cancelOrder(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to cancel this order");
        }

        if (!"PENDING".equals(order.getStatus()) && !"CONFIRMED".equals(order.getStatus())) {
            throw new IllegalArgumentException("Cannot cancel order in status: " + order.getStatus());
        }

        order.setStatus("CANCELLED");
        Order savedOrder = orderRepository.save(order);

        // Publish OrderCancelledEvent
        OrderCancelledEvent cancelledEvent = OrderCancelledEvent.builder()
                .orderId(orderId)
                .userId(userId)
                .reason("User request")
                .build();

        kafkaTemplate.send("order-cancelled-topic", orderId.toString(), cancelledEvent);
        log.info("Cancelled order {} and published OrderCancelledEvent", orderId);

        return mapToResponseDto(savedOrder);
    }

    private OrderResponseDto mapToResponseDto(Order order) {
        List<OrderResponseDto.OrderItemResponseDto> itemDtos = order.getItems().stream()
                .map(item -> OrderResponseDto.OrderItemResponseDto.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        return OrderResponseDto.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .items(itemDtos)
                .createdAt(order.getCreatedAt())
                .deliveredAt(order.getDeliveredAt())
                .build();
    }
}
