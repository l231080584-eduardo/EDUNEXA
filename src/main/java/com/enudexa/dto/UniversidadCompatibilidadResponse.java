package com.enudexa.dto;

import java.util.UUID;

public record UniversidadCompatibilidadResponse(
        UUID id,
        String nombre,
        String tipo,
        Double latitud,
        Double longitud,
        String sitioWeb,
        Boolean esTecnmIztapalapa1,
        double matchScorePercentage
) {
}
