package com.orinetador.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DemoApplicationTests {

    @LocalServerPort
    private int port;

    private final RestTemplate restTemplate = new RestTemplate();

    @Test
    void shouldExposeHealthEndpoint() {
        var response = restTemplate.getForEntity(
                "http://localhost:" + port + "/health",
                String.class
        );

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).contains("status");
    }

    @Test
    void shouldExposeRootEndpoint() {
        var response = restTemplate.getForEntity(
                "http://localhost:" + port + "/",
                String.class
        );

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }
}