package com.ecom.orderservice.messaging;

import com.ecom.common.event.OrderCompletedEvent;
import com.ecom.common.event.PaymentCompletedEvent;
import com.ecom.common.event.PaymentFailedEvent;
import com.ecom.common.event.StockReservationFailedEvent;
import com.ecom.orderservice.domain.model.Order;
import com.ecom.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventListener {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(topics = "stock-failed-topic", groupId = "order-group")
    @Transactional
    public void handleStockReservationFailed(StockReservationFailedEvent event) {
        log.info("Received StockReservationFailedEvent for order {}. Reason: {}", event.getOrderId(), event.getReason());
        orderRepository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus("FAILED");
            orderRepository.save(order);
            log.info("Order {} status updated to FAILED", order.getId());
        });
    }

    @KafkaListener(topics = "payment-completed-topic", groupId = "order-group")
    @Transactional
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        log.info("Received PaymentCompletedEvent for order {}. Ref: {}", event.getOrderId(), event.getTransactionReference());
        orderRepository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus("CONFIRMED");
            orderRepository.save(order);
            log.info("Order {} status updated to CONFIRMED", order.getId());

            // Emit OrderCompletedEvent for Notification Service
            OrderCompletedEvent completedEvent = OrderCompletedEvent.builder()
                    .orderId(order.getId())
                    .userId(order.getUserId())
                    .totalAmount(order.getTotalAmount())
                    .build();
            kafkaTemplate.send("order-completed-topic", order.getId().toString(), completedEvent);
            log.info("Published OrderCompletedEvent for order {}", order.getId());
        });
    }

    @KafkaListener(topics = "payment-failed-topic", groupId = "order-group")
    @Transactional
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("Received PaymentFailedEvent for order {}. Reason: {}", event.getOrderId(), event.getReason());
        orderRepository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus("FAILED");
            orderRepository.save(order);
            log.info("Order {} status updated to FAILED", order.getId());
        });
    }
}
