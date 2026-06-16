package com.ecom.paymentservice.messaging;

import com.ecom.common.event.StockReservedEvent;
import com.ecom.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {

    private final PaymentService paymentService;

    @KafkaListener(topics = "stock-reserved-topic", groupId = "payment-group")
    public void handleStockReserved(StockReservedEvent event) {
        log.info("Received StockReservedEvent for order {}. Triggering payment processing.", event.getOrderId());
        paymentService.processPayment(event.getOrderId(), event.getUserId());
    }
}
