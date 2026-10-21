package com.enudexa.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

@Configuration
public class EnvValidatorConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(EnvValidatorConfig.class);

    @Bean
    ApplicationRunner validateEnvironment(DataSource dataSource, Environment environment) {
        return args -> {
            List<String> requiredProperties = List.of(
                    "spring.datasource.url",
                    "spring.datasource.username",
                    "cors.allowed-origins",
                    "external.api.url"
            );
            List<String> missing = requiredProperties.stream()
                    .filter(property -> {
                        String value = environment.getProperty(property);
                        return value == null || value.isBlank();
                    })
                    .toList();
            if (!missing.isEmpty()) {
                String message = "Faltan configuraciones críticas: " + String.join(", ", missing);
                LOGGER.error(message);
                throw new IllegalStateException(message);
            }

            validateExternalUrl(environment.getProperty("external.api.url"));
            try (Connection ignored = dataSource.getConnection()) {
                LOGGER.info("Configuración validada y conexión a la base de datos establecida.");
            } catch (SQLException exception) {
                LOGGER.error("No fue posible conectar con la base de datos. Verifique SPRING_DATASOURCE_URL y credenciales.",
                        exception);
                throw new IllegalStateException("No fue posible establecer conexión con la base de datos", exception);
            }
        };
    }

    private void validateExternalUrl(String value) {
        try {
            URI uri = URI.create(value);
            if (!uri.isAbsolute() || uri.getHost() == null
                    || !("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException exception) {
            LOGGER.error("La configuración external.api.url debe ser una URL HTTP o HTTPS válida.");
            throw new IllegalStateException("Configuración inválida para external.api.url", exception);
        }
    }
}
