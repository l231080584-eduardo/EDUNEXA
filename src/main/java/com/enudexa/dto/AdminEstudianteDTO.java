package com.enudexa.dto;

import java.time.LocalDateTime;

public record AdminEstudianteDTO(
        String nombre,
        String email,
        String whatsapp,
        String carreraRecomendada,
        String universidadRecomendada,
        LocalDateTime fechaCreacion,
        Boolean consentimientoContacto,
        Boolean interesTecnm
) {
}
