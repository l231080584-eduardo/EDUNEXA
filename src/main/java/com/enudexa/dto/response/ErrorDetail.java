package com.enudexa.dto.response;

import java.util.List;

public record ErrorDetail(String codigo, String mensaje, List<String> detalles) {
}
