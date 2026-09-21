package com.orinetador.demo.Controllers;

import com.orinetador.demo.Services.EscuelaService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/escuelas")
public class EscuelaController {

    private final EscuelaService escuelaService;

    public EscuelaController(EscuelaService escuelaService) {
        this.escuelaService = escuelaService;
    }

    @GetMapping("/{criterio}")
    public Map<String, Object> buscarEscuelas(
            @PathVariable String criterio) {

        List<Map<String, Object>> resultados =
                escuelaService.buscarEscuelas(criterio);

        Map<String, Object> respuesta = new HashMap<>();

        respuesta.put("criterio", criterio);
        respuesta.put("total", resultados.size());
        respuesta.put("resultados", resultados);

        if (resultados.isEmpty()) {
            respuesta.put("mensaje",
                    "No se encontraron instituciones para el criterio indicado.");
        }

        return respuesta;
    }
}