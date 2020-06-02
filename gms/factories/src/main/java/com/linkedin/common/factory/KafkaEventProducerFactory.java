package com.linkedin.common.factory;

import io.confluent.kafka.serializers.KafkaAvroSerializer;
import io.confluent.kafka.serializers.AbstractKafkaAvroSerDeConfig;
import org.apache.avro.generic.IndexedRecord;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Properties;

@Configuration
public class KafkaEventProducerFactory {

  @Value("${KAFKA_BOOTSTRAP_SERVER:localhost:9092}")
  private String kafkaBootstrapServers;

  @Value("${KAFKA_SCHEMAREGISTRY_URL:http://localhost:8081}")
  private String kafkaSchemaRegistryUrl;

  @Bean(name = "kafkaEventProducer")
  protected Producer<String, IndexedRecord> createInstance() {
    Properties props = new Properties();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,
        com.linkedin.util.Configuration.getEnvironmentVariable("KAFKA_BOOTSTRAP_SERVER", kafkaBootstrapServers));
    props.put(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG,
        com.linkedin.util.Configuration.getEnvironmentVariable("KAFKA_SCHEMAREGISTRY_URL", kafkaSchemaRegistryUrl));
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, KafkaAvroSerializer.class.getName());
    if (!com.linkedin.util.Configuration.getEnvironmentVariable("KAFKA_SASL_JAAS_CONFIG", "").equals("")) {
        props.put(SaslConfigs.SASL_MECHANISM,
            com.linkedin.util.Configuration.getEnvironmentVariable("KAFKA_SASL_MECHANISM", SaslConfigs.DEFAULT_SASL_MECHANISM));
        props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG,
            com.linkedin.util.Configuration.getEnvironmentVariable("KAFKA_SASL_SECURITY_PROTOCOL", "SASL_SSL"));
        props.put(SaslConfigs.SASL_JAAS_CONFIG,
            com.linkedin.util.Configuration.getEnvironmentVariable("KAFKA_SASL_JAAS_CONFIG"));
    }
    if (!com.linkedin.util.Configuration.getEnvironmentVariable("KAFKA_SCHEMAREGISTRY_BASIC_AUTH_USER_INFO", "").equals("")) {
        props.put(AbstractKafkaAvroSerDeConfig.BASIC_AUTH_CREDENTIALS_SOURCE, "USER_INFO");
        props.put(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_USER_INFO_CONFIG,
            com.linkedin.util.Configuration.getEnvironmentVariable("KAFKA_SCHEMAREGISTRY_BASIC_AUTH_USER_INFO"));
    }

    return new KafkaProducer(props);
  }
}
