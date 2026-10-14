package com.enudexa.exception;

import com.enudexa.dto.response.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        List<String> detalles = exception.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .toList();
        return error(HttpStatus.BAD_REQUEST, "VALIDACION", "La solicitud contiene campos inválidos", detalles);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableMessage(HttpMessageNotReadableException exception) {
        return error(HttpStatus.BAD_REQUEST, "SOLICITUD_INVALIDA",
                "El cuerpo de la solicitud no tiene un formato válido", List.of());
    }

    @ExceptionHandler({EntityNotFoundException.class, ResourceNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleNotFound(RuntimeException exception) {
        return error(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", exception.getMessage(), List.of());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException exception) {
        return error(HttpStatus.UNAUTHORIZED, "NO_AUTORIZADO", exception.getMessage(), List.of());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return error(HttpStatus.BAD_REQUEST, "SOLICITUD_INVALIDA", exception.getMessage(), List.of());
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ErrorResponse> handleExternalService(ExternalServiceException exception) {
        return error(HttpStatus.BAD_GATEWAY, "SERVICIO_EXTERNO",
                "No fue posible consultar el servicio externo", List.of());
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandler(NoHandlerFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "RUTA_NO_ENCONTRADA",
                "La ruta solicitada no existe", List.of());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String mensaje = exception.getReason() == null ? status.getReasonPhrase() : exception.getReason();
        String codigo = status == HttpStatus.NOT_FOUND ? "NO_ENCONTRADO"
                : status == HttpStatus.UNAUTHORIZED ? "NO_AUTORIZADO" : "SOLICITUD_INVALIDA";
        return error(status, codigo, mensaje, List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception) {
        LOGGER.error("Error no controlado al procesar la solicitud", exception);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO",
                "Ocurrió un error interno", List.of());
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }

    private ResponseEntity<ErrorResponse> error(
            HttpStatus status, String codigo, String mensaje, List<String> detalles) {
        return ResponseEntity.status(status).body(ErrorResponse.of(codigo, mensaje, detalles));
    }
}
