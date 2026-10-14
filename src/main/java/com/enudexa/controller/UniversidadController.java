package com.enudexa.controller;

import com.enudexa.entity.Universidad;
import com.enudexa.dto.response.ApiResponse;
import com.enudexa.repository.UniversidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/universidades")
@RequiredArgsConstructor
public class UniversidadController {

    private final UniversidadRepository universidadRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Universidad>>> obtenerTodas() {
        return ResponseEntity.ok(ApiResponse.success(universidadRepository.findAll(), "Universidades obtenidas"));
    }

    @GetMapping("/tecnm")
    public ResponseEntity<ApiResponse<List<Universidad>>> obtenerTecNM() {
        List<Universidad> universidades = universidadRepository.findAll().stream()
                .filter(this::esInstitutoTecnologico)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(universidades, "Universidades TecNM obtenidas"));
    }

    @GetMapping("/iztapalapa1")
    public ResponseEntity<ApiResponse<List<Universidad>>> obtenerIztapalapa1() {
        return ResponseEntity.ok(ApiResponse.success(
                universidadRepository.findByEsTecnmIztapalapa1True(), "Universidades Iztapalapa 1 obtenidas"));
    }

    private boolean esInstitutoTecnologico(Universidad universidad) {
        String nombre = normalizar(universidad.getNombre());
        String tipo = normalizar(universidad.getTipo());

        return nombre.contains("TECNM")
                || nombre.contains("TECNOLOGICO NACIONAL DE MEXICO")
                || nombre.contains("INSTITUTO TECNOLOGICO")
                || tipo.contains("TECNOLOGICO")
                || tipo.contains("TECNM");
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return "";
        }
        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT);
    }
}
