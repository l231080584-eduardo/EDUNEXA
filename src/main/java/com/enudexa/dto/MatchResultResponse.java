package com.enudexa.dto;

import java.util.UUID;

public record MatchResultResponse(
        UUID resultadoId,
        UUID usuarioId,
        double matchScore,
        boolean bonoIztapalapa1
) {
}
