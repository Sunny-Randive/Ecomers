package com.ecom.orderservice;

import com.ecom.common.event.OrderCreatedEvent;
import com.ecom.common.event.PaymentCompletedEvent;
import com.ecom.common.event.PaymentFailedEvent;
import com.ecom.common.event.StockReservationFailedEvent;
import com.ecom.orderservice.client.CartClient;
import com.ecom.orderservice.client.ProductClient;
import com.ecom.orderservice.domain.model.Order;
import com.ecom.orderservice.dto.OrderResponseDto;
import com.ecom.orderservice.dto.PlaceOrderRequest;
import com.ecom.orderservice.dto.client.CartDto;
import com.ecom.orderservice.dto.client.CartItemDto;
import com.ecom.orderservice.dto.client.ProductDto;
import com.ecom.orderservice.repository.OrderRepository;
import com.ecom.orderservice.service.OrderService;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class OrderSagaIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("ecom_order")
            .withUsername("postgres")
            .withPassword("password");

    @Container
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("eureka.client.enabled", () -> "false");
        registry.add("spring.cloud.config.enabled", () -> "false");
    }

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockBean
    private CartClient cartClient;

    @MockBean
    private ProductClient productClient;

    private Consumer<String, OrderCreatedEvent> kafkaConsumer;

    @BeforeEach
    public void setup() {
        orderRepository.deleteAll();

        Map<String, Object> consumerProps = new HashMap<>();
        consumerProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
        consumerProps.put(ConsumerConfig.GROUP_ID_CONFIG, "test-order-group");
        consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        consumerProps.put(JsonDeserializer.TRUSTED_PACKAGES, "com.ecom.common.event");

        ConsumerFactory<String, OrderCreatedEvent> consumerFactory = new DefaultKafkaConsumerFactory<>(
                consumerProps, new StringDeserializer(), new JsonDeserializer<>(OrderCreatedEvent.class, false));

        kafkaConsumer = consumerFactory.createConsumer();
        kafkaConsumer.subscribe(Collections.singletonList("order-created-topic"));
    }

    @Test
    public void testCompleteSagaLifecycle_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID cartItemId = UUID.randomUUID();

        CartItemDto cartItem = CartItemDto.builder()
                .id(cartItemId)
                .productId(productId)
                .quantity(2)
                .build();

        CartDto cartDto = CartDto.builder()
                .userId(userId)
                .items(Collections.singletonList(cartItem))
                .build();

        ProductDto productDto = ProductDto.builder()
                .id(productId)
                .name("Test Product")
                .price(new BigDecimal("49.99"))
                .build();

        Mockito.when(cartClient.getCart(userId.toString())).thenReturn(cartDto);
        Mockito.when(productClient.getProductById(productId)).thenReturn(productDto);
        Mockito.when(cartClient.clearCart(userId.toString())).thenReturn("Cart cleared successfully");

        PlaceOrderRequest request = new PlaceOrderRequest();
        OrderResponseDto response = orderService.checkout(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("99.98"));

        UUID orderId = response.getId();

        ConsumerRecord<String, OrderCreatedEvent> record = KafkaTestUtils.getSingleRecord(kafkaConsumer, "order-created-topic", java.time.Duration.ofMillis(5000));
        assertThat(record).isNotNull();
        assertThat(record.value().getOrderId()).isEqualTo(orderId);
        assertThat(record.value().getTotalAmount()).isEqualByComparingTo(new BigDecimal("99.98"));
        kafkaConsumer.close();

        PaymentCompletedEvent paymentEvent = PaymentCompletedEvent.builder()
                .orderId(orderId)
                .paymentId(UUID.randomUUID())
                .amount(new BigDecimal("99.98"))
                .transactionReference("TXN-12345")
                .build();

        kafkaTemplate.send("payment-completed-topic", orderId.toString(), paymentEvent);

        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            Order order = orderRepository.findById(orderId).orElse(null);
            assertThat(order).isNotNull();
            assertThat(order.getStatus()).isEqualTo("CONFIRMED");
        });
    }

    @Test
    public void testCompleteSagaLifecycle_PaymentFailed() {
        UUID userId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID cartItemId = UUID.randomUUID();

        CartItemDto cartItem = CartItemDto.builder()
                .id(cartItemId)
                .productId(productId)
                .quantity(1)
                .build();

        CartDto cartDto = CartDto.builder()
                .userId(userId)
                .items(Collections.singletonList(cartItem))
                .build();

        ProductDto productDto = ProductDto.builder()
                .id(productId)
                .name("Test Product")
                .price(new BigDecimal("100.00"))
                .build();

        Mockito.when(cartClient.getCart(userId.toString())).thenReturn(cartDto);
        Mockito.when(productClient.getProductById(productId)).thenReturn(productDto);
        Mockito.when(cartClient.clearCart(userId.toString())).thenReturn("Cart cleared successfully");

        PlaceOrderRequest request = new PlaceOrderRequest();
        OrderResponseDto response = orderService.checkout(userId, request);
        UUID orderId = response.getId();

        PaymentFailedEvent paymentFailedEvent = PaymentFailedEvent.builder()
                .orderId(orderId)
                .reason("Insufficient funds")
                .build();

        kafkaTemplate.send("payment-failed-topic", orderId.toString(), paymentFailedEvent);

        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            Order order = orderRepository.findById(orderId).orElse(null);
            assertThat(order).isNotNull();
            assertThat(order.getStatus()).isEqualTo("FAILED");
        });
    }

    @Test
    public void testCompleteSagaLifecycle_StockFailed() {
        UUID userId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID cartItemId = UUID.randomUUID();

        CartItemDto cartItem = CartItemDto.builder()
                .id(cartItemId)
                .productId(productId)
                .quantity(10)
                .build();

        CartDto cartDto = CartDto.builder()
                .userId(userId)
                .items(Collections.singletonList(cartItem))
                .build();

        ProductDto productDto = ProductDto.builder()
                .id(productId)
                .name("Test Product")
                .price(new BigDecimal("10.00"))
                .build();

        Mockito.when(cartClient.getCart(userId.toString())).thenReturn(cartDto);
        Mockito.when(productClient.getProductById(productId)).thenReturn(productDto);
        Mockito.when(cartClient.clearCart(userId.toString())).thenReturn("Cart cleared successfully");

        PlaceOrderRequest request = new PlaceOrderRequest();
        OrderResponseDto response = orderService.checkout(userId, request);
        UUID orderId = response.getId();

        StockReservationFailedEvent stockFailedEvent = StockReservationFailedEvent.builder()
                .orderId(orderId)
                .reason("Out of stock")
                .build();

        kafkaTemplate.send("stock-failed-topic", orderId.toString(), stockFailedEvent);

        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            Order order = orderRepository.findById(orderId).orElse(null);
            assertThat(order).isNotNull();
            assertThat(order.getStatus()).isEqualTo("FAILED");
        });
    }
}
