package com.enudexa.controller;

import com.enudexa.dto.UniversidadCompatibilidadResponse;
import com.enudexa.entity.Universidad;
import com.enudexa.repository.UniversidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/evaluaciones")
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
public class EvaluacionController {

    private static final double BONO_IZTAPALAPA_1_PORCENTAJE = 10.0;

    private final UniversidadRepository universidadRepository;

    @GetMapping("/compatibilidad")
    public ResponseEntity<List<UniversidadCompatibilidadResponse>> obtenerCompatibilidad() {
        List<UniversidadCompatibilidadResponse> respuesta = universidadRepository.findAll().stream()
                .map(this::crearResultado)
                .sorted(Comparator.comparingDouble(UniversidadCompatibilidadResponse::matchScorePercentage)
                        .reversed()
                        .thenComparing(UniversidadCompatibilidadResponse::nombre,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();

        return ResponseEntity.ok(respuesta);
    }

    private UniversidadCompatibilidadResponse crearResultado(Universidad universidad) {
        boolean esIztapalapa1 = Boolean.TRUE.equals(universidad.getEsTecnmIztapalapa1());
        double porcentaje = esIztapalapa1 ? BONO_IZTAPALAPA_1_PORCENTAJE : 0.0;

        return new UniversidadCompatibilidadResponse(
                universidad.getId(),
                universidad.getNombre(),
                universidad.getTipo(),
                universidad.getLatitud(),
                universidad.getLongitud(),
                universidad.getSitioWeb(),
                universidad.getEsTecnmIztapalapa1(),
                porcentaje
        );
    }
}
