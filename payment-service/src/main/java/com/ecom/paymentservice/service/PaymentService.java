package com.ecom.paymentservice.service;

import com.ecom.common.event.PaymentCompletedEvent;
import com.ecom.common.event.PaymentFailedEvent;
import com.ecom.paymentservice.domain.model.Payment;
import com.ecom.paymentservice.dto.client.OrderDto;
import com.ecom.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.ecom.paymentservice.client.OrderClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final Random random = new Random();

    @Transactional
    @CircuitBreaker(name = "orderClient", fallbackMethod = "processPaymentFallback")
    public void processPayment(UUID orderId, UUID userId) {
        log.info("Processing payment for order {}", orderId);

        try {
            // 1. Fetch Order details to obtain amount via Feign Client
            OrderDto orderDto = orderClient.getOrderById(orderId, userId.toString());
            if (orderDto == null) {
                throw new IllegalArgumentException("Order details not found: " + orderId);
            }

            BigDecimal amount = orderDto.getTotalAmount();
            String transactionRef = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            // 2. Simulate mock transaction (95% success rate to demonstrate Saga compensation on failure)
            boolean isSuccess = random.nextDouble() < 0.95; 
            
            Payment payment = Payment.builder()
                    .orderId(orderId)
                    .amount(amount)
                    .transactionStatus(isSuccess ? "SUCCESS" : "FAILED")
                    .transactionReference(transactionRef)
                    .build();

            paymentRepository.save(payment);

            if (isSuccess) {
                log.info("Payment succeeded for order {} with Ref {}", orderId, transactionRef);
                
                PaymentCompletedEvent completedEvent = PaymentCompletedEvent.builder()
                        .orderId(orderId)
                        .paymentId(payment.getId())
                        .amount(amount)
                        .transactionReference(transactionRef)
                        .build();

                kafkaTemplate.send("payment-completed-topic", orderId.toString(), completedEvent);
                log.info("Published PaymentCompletedEvent for order {}", orderId);
            } else {
                log.warn("Payment failed simulation for order {}", orderId);
                
                PaymentFailedEvent failedEvent = PaymentFailedEvent.builder()
                        .orderId(orderId)
                        .reason("Card declined (Simulated Failure)")
                        .build();

                kafkaTemplate.send("payment-failed-topic", orderId.toString(), failedEvent);
                log.info("Published PaymentFailedEvent for order {}", orderId);
            }

        } catch (Exception e) {
            log.error("Error processing payment for order {}: {}", orderId, e.getMessage());
            
            // Publish failure fallback
            PaymentFailedEvent failedEvent = PaymentFailedEvent.builder()
                    .orderId(orderId)
                    .reason(e.getMessage())
                    .build();
            kafkaTemplate.send("payment-failed-topic", orderId.toString(), failedEvent);
        }
    }

    public void processPaymentFallback(UUID orderId, UUID userId, Throwable t) {
        log.error("Payment fallback triggered for order {}. Circuit open/error: {}", orderId, t.getMessage());
        // Publish failure event to trigger compensation rollback
        PaymentFailedEvent failedEvent = PaymentFailedEvent.builder()
                .orderId(orderId)
                .reason("Payment service communication failure (Order Service unavailable)")
                .build();
        kafkaTemplate.send("payment-failed-topic", orderId.toString(), failedEvent);
        log.info("Published fallback PaymentFailedEvent for order {}", orderId);
    }
}
