package com.enudexa.controller;

import com.enudexa.entity.Universidad;
import com.enudexa.repository.UniversidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/universidades")
@CrossOrigin(
        origins = "*",
        methods = {
                org.springframework.web.bind.annotation.RequestMethod.GET,
                org.springframework.web.bind.annotation.RequestMethod.POST,
                org.springframework.web.bind.annotation.RequestMethod.PUT,
                org.springframework.web.bind.annotation.RequestMethod.DELETE,
                org.springframework.web.bind.annotation.RequestMethod.OPTIONS
        },
        allowedHeaders = "*"
)
@RequiredArgsConstructor
public class UniversidadController {

    private final UniversidadRepository universidadRepository;

    @GetMapping
    public ResponseEntity<List<Universidad>> obtenerTodas() {
        return ResponseEntity.ok(universidadRepository.findAll());
    }

    @GetMapping("/tecnm")
    public ResponseEntity<List<Universidad>> obtenerTecNM() {
        List<Universidad> universidades = universidadRepository.findAll().stream()
                .filter(this::esInstitutoTecnologico)
                .toList();
        return ResponseEntity.ok(universidades);
    }

    @GetMapping("/iztapalapa1")
    public ResponseEntity<List<Universidad>> obtenerIztapalapa1() {
        return ResponseEntity.ok(universidadRepository.findByEsTecnmIztapalapa1True());
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
