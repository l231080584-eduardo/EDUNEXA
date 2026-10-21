package com.enudexa.dto;

import java.util.UUID;
import java.util.List;

public record UniversidadCompatibilidadResponse(
        UUID id,
        String nombre,
        String tipo,
        Double latitud,
        Double longitud,
        String direccion,
        String sitioWeb,
        Boolean esTecnmIztapalapa1,
        double matchScorePercentage,
        List<String> carreras
) {
}
