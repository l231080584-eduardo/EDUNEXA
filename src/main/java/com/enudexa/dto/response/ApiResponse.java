package com.enudexa.dto.response;

public record ApiResponse<T>(boolean ok, T data, String mensaje) {

    public static <T> ApiResponse<T> success(T data, String mensaje) {
        return new ApiResponse<>(true, data, mensaje);
    }
}
