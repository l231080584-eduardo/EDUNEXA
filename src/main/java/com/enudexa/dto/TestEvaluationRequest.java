package com.enudexa.dto;

import java.util.UUID;

public record TestEvaluationRequest(
        UUID usuarioId,
        Double intereses,
        Double materias,
        Double estiloVida,
        Double geolocalizacion,
        Boolean esTecnmIztapalapa1,
        String vectorRespuestas,
        String topCarrerasJson,
        String reporteIa
) {
}
