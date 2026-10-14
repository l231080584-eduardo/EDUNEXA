package com.enudexa.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TestEvaluationRequest(
        @NotNull(message = "El usuario es obligatorio")
        UUID usuarioId,
        @NotNull(message = "La métrica intereses es obligatoria")
        @DecimalMin(value = "0.0", message = "intereses debe ser como mínimo 0.0")
        @DecimalMax(value = "1.0", message = "intereses debe ser como máximo 1.0")
        Double intereses,
        @NotNull(message = "La métrica materias es obligatoria")
        @DecimalMin(value = "0.0", message = "materias debe ser como mínimo 0.0")
        @DecimalMax(value = "1.0", message = "materias debe ser como máximo 1.0")
        Double materias,
        @NotNull(message = "La métrica estiloVida es obligatoria")
        @DecimalMin(value = "0.0", message = "estiloVida debe ser como mínimo 0.0")
        @DecimalMax(value = "1.0", message = "estiloVida debe ser como máximo 1.0")
        Double estiloVida,
        @NotNull(message = "La métrica geolocalizacion es obligatoria")
        @DecimalMin(value = "0.0", message = "geolocalizacion debe ser como mínimo 0.0")
        @DecimalMax(value = "1.0", message = "geolocalizacion debe ser como máximo 1.0")
        Double geolocalizacion,
        Boolean esTecnmIztapalapa1,
        String vectorRespuestas,
        String topCarrerasJson,
        String reporteIa
) {
}
