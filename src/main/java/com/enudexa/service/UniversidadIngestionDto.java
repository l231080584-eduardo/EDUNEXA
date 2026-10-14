package com.enudexa.service;

import java.util.List;

record UniversidadIngestionDto(
        String nombre,
        String tipo,
        Double latitud,
        Double longitud,
        String sitioWeb,
        boolean esTecnmIztapalapa1,
        List<CarreraIngestionDto> carreras
) {
}
