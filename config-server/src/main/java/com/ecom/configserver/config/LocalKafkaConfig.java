package com.ecom.configserver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.EmbeddedKafkaZKBroker;

@Configuration
@Profile("local")
public class LocalKafkaConfig {

    @Bean
    public EmbeddedKafkaBroker embeddedKafkaBroker() {
        System.out.println("=========================================================");
        System.out.println(" Starting Embedded Kafka Broker on port 9092... ");
        System.out.println("=========================================================");
        
        EmbeddedKafkaZKBroker broker = new EmbeddedKafkaZKBroker(1, true,
                "order-created-topic",
                "stock-reserved-topic",
                "stock-failed-topic",
                "payment-completed-topic",
                "payment-failed-topic",
                "order-completed-topic",
                "order-cancelled-topic"
        );
        
        broker.kafkaPorts(9092);
        broker.brokerProperty("num.partitions", 1);
        
        return broker;
    }
}

