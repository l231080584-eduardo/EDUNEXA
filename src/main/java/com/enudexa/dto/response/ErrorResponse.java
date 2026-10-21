package com.enudexa.dto.response;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
        boolean ok,
        ErrorDetail error,
        String message,
        Instant timestamp,
        int status
) {

    public static ErrorResponse of(int status, String codigo, String mensaje, List<String> detalles) {
        return new ErrorResponse(false, new ErrorDetail(codigo, mensaje, detalles), mensaje, Instant.now(), status);
    }
}
