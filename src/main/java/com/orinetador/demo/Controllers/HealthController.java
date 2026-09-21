package com.orinetador.demo.Controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> healthCheck() {

        Map<String, Object> response = new HashMap<>();

        response.put("status", "online");
        response.put("message", "Servidor Arriba");
        response.put("server_time", LocalDateTime.now().toString());

        return response;
    }


    @GetMapping("/")
    public String root() {
        return "Servidor funcionando. Visita /health";
    }
}

