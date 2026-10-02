package com.enudexa.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String nombre,
        String email,
        LocalDateTime fechaRegistro
) {
}
