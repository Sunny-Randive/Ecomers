package com.ecom.notificationservice.messaging;

import com.ecom.common.event.OrderCancelledEvent;
import com.ecom.common.event.OrderCompletedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NotificationEventListener {

    @KafkaListener(topics = "order-completed-topic", groupId = "notification-group")
    public void handleOrderCompleted(OrderCompletedEvent event) {
        log.info("--------------------------------------------------------------------------------");
        log.info("MOCK EMAIL DISPATCHED TO USER: {}", event.getUserId());
        log.info("Subject: Order Confirmation - Order #{}", event.getOrderId());
        log.info("Dear Customer,");
        log.info("Thank you for your purchase! We are pleased to confirm that your order #{} has been received.");
        log.info("Total Amount charged: ${}", event.getTotalAmount());
        log.info("We will notify you once your order is shipped.");
        log.info("Best regards,");
        log.info("E-Commerce Platform Team");
        log.info("--------------------------------------------------------------------------------");
    }

    @KafkaListener(topics = "order-cancelled-topic", groupId = "notification-group")
    public void handleOrderCancelled(OrderCancelledEvent event) {
        log.info("--------------------------------------------------------------------------------");
        log.info("MOCK EMAIL DISPATCHED TO USER: {}", event.getUserId());
        log.info("Subject: Order Cancellation - Order #{}", event.getOrderId());
        log.info("Dear Customer,");
        log.info("We regret to inform you that your order #{} has been cancelled.");
        log.info("Reason: {}", event.getReason());
        log.info("If any amount was deducted, a refund will be processed back to your original payment method.");
        log.info("Best regards,");
        log.info("E-Commerce Platform Team");
        log.info("--------------------------------------------------------------------------------");
    }
}
