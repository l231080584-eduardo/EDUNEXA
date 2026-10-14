package com.enudexa.controller;

import com.enudexa.dto.EvaluacionArcadeResponseDTO;
import com.enudexa.dto.TestEvaluationRequest;
import com.enudexa.dto.response.ApiResponse;
import com.enudexa.service.TestVocacionalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test/arcade")
@RequiredArgsConstructor
public class TestVocacionalController {

    private final TestVocacionalService testVocacionalService;

    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<EvaluacionArcadeResponseDTO>> evaluarTest(
            @Valid @RequestBody TestEvaluationRequest request,
            @RequestParam(defaultValue = "NUEVO-PL4YER") String nickname) {
        EvaluacionArcadeResponseDTO resultado =
                testVocacionalService.procesarEvaluacionArcade(request, nickname);
        return ResponseEntity.ok(ApiResponse.success(
                resultado, "Análisis de NONI procesado exitosamente con mapeo interactivo"));
    }
}
