package com.enudexa.controller;

import com.enudexa.entity.ResultadoTest;
import com.enudexa.repository.ResultadoTestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@RequestMapping({"/api/v1/evaluaciones", "/evaluaciones"})
@CrossOrigin(origins = "*")
public class ResultadoTestController {

    private final ResultadoTestRepository resultadoTestRepository;

    public ResultadoTestController(ResultadoTestRepository resultadoTestRepository) {
        this.resultadoTestRepository = resultadoTestRepository;
    }

    @PostMapping
    public ResponseEntity<ResultadoTest> crear(@RequestBody ResultadoTest resultadoTest) {
        ResultadoTest guardado = resultadoTestRepository.save(resultadoTest);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    @GetMapping
    public ResponseEntity<List<ResultadoTest>> obtenerTodos() {
        return ResponseEntity.ok(resultadoTestRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultadoTest> obtenerPorId(@PathVariable Long id) {
        return resultadoTestRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResultadoTest> actualizar(
            @PathVariable Long id,
            @RequestBody ResultadoTest datosActualizados) {
        return resultadoTestRepository.findById(id)
                .map(resultado -> {
                    resultado.setPuntajeGeneral(datosActualizados.getPuntajeGeneral());
                    resultado.setCarreraSugerida(datosActualizados.getCarreraSugerida());
                    return ResponseEntity.ok(resultadoTestRepository.save(resultado));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!resultadoTestRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        resultadoTestRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
