package com.enudexa.controller;

import com.enudexa.dto.MatchResultResponse;
import com.enudexa.dto.TestEvaluationRequest;
import com.enudexa.service.EvaluacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/test")
public class TestController {

    private final EvaluacionService evaluacionService;

    public TestController(EvaluacionService evaluacionService) {
        this.evaluacionService = evaluacionService;
    }

    @PostMapping("/evaluate")
    public ResponseEntity<MatchResultResponse> evaluate(@RequestBody TestEvaluationRequest request) {
        return ResponseEntity.ok(evaluacionService.evaluar(request));
    }

    @GetMapping("/resultados")
    public ResponseEntity<List<MatchResultResponse>> resultados(
            @RequestParam(required = false) UUID usuarioId) {
        List<MatchResultResponse> respuesta = evaluacionService.obtenerResultados(usuarioId).stream()
                .map(resultado -> new MatchResultResponse(
                        resultado.getId(),
                        resultado.getUsuario().getId(),
                        resultado.getPuntajeMatch() == null ? 0.0 : resultado.getPuntajeMatch(),
                        false))
                .toList();
        return ResponseEntity.ok(respuesta);
    }
}
