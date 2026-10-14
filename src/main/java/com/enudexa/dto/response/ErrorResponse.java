package com.enudexa.dto.response;

public record ErrorResponse(boolean ok, ErrorDetail error) {

    public static ErrorResponse of(String codigo, String mensaje, java.util.List<String> detalles) {
        return new ErrorResponse(false, new ErrorDetail(codigo, mensaje, detalles));
    }
}
