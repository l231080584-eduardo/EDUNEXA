package com.enudexa.dto;

public record UniversidadCompatibilidadResponse(
        Long id,
        String nombre,
        String tipo,
        Double latitud,
        Double longitud,
        String sitioWeb,
        Boolean esTecnmIztapalapa1,
        double matchScorePercentage
) {
}
