package com.enudexa.dto;

import java.util.UUID;

public record MatchResultResponse(
        Long resultadoId,
        UUID usuarioId,
        double matchScore,
        boolean bonoIztapalapa1
) {
}
