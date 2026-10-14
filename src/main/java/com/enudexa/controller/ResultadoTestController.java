package com.enudexa.controller;

import com.enudexa.entity.ResultadoTest;
import com.enudexa.dto.response.ApiResponse;
import com.enudexa.exception.ResourceNotFoundException;
import com.enudexa.repository.ResultadoTestRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/evaluaciones")
public class ResultadoTestController {

    private final ResultadoTestRepository resultadoTestRepository;

    public ResultadoTestController(ResultadoTestRepository resultadoTestRepository) {
        this.resultadoTestRepository = resultadoTestRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ResultadoTest>> crear(@Valid @RequestBody ResultadoTest resultadoTest) {
        ResultadoTest guardado = resultadoTestRepository.save(resultadoTest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(guardado, "Resultado creado correctamente"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResultadoTest>>> obtenerTodos() {
        return ResponseEntity.ok(ApiResponse.success(resultadoTestRepository.findAll(), "Resultados obtenidos"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResultadoTest>> obtenerPorId(@PathVariable Long id) {
        ResultadoTest resultado = resultadoTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resultado no encontrado"));
        return ResponseEntity.ok(ApiResponse.success(resultado, "Resultado encontrado"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResultadoTest>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ResultadoTest datosActualizados) {
        ResultadoTest resultado = resultadoTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resultado no encontrado"));
        resultado.setPuntajeGeneral(datosActualizados.getPuntajeGeneral());
        resultado.setCarreraSugerida(datosActualizados.getCarreraSugerida());
        return ResponseEntity.ok(ApiResponse.success(
                resultadoTestRepository.save(resultado), "Resultado actualizado correctamente"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!resultadoTestRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resultado no encontrado");
        }

        resultadoTestRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
