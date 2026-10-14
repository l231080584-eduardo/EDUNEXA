package com.enudexa.controller;

import com.enudexa.dto.UniversidadCompatibilidadResponse;
import com.enudexa.dto.response.ApiResponse;
import com.enudexa.entity.Universidad;
import com.enudexa.repository.UniversidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/evaluaciones")
@RequiredArgsConstructor
public class EvaluacionController {

    private static final double BONO_IZTAPALAPA_1_PORCENTAJE = 10.0;

    private final UniversidadRepository universidadRepository;

    @GetMapping("/compatibilidad")
    public ResponseEntity<ApiResponse<List<UniversidadCompatibilidadResponse>>> obtenerCompatibilidad() {
        List<UniversidadCompatibilidadResponse> respuesta = universidadRepository.findAllWithCarreras().stream()
                .map(this::crearResultado)
                .sorted(Comparator.comparingDouble(UniversidadCompatibilidadResponse::matchScorePercentage)
                        .reversed()
                        .thenComparing(UniversidadCompatibilidadResponse::nombre,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(respuesta, "Compatibilidad obtenida correctamente"));
    }

    private UniversidadCompatibilidadResponse crearResultado(Universidad universidad) {
        boolean esIztapalapa1 = universidad.isEsTecnmIztapalapa1();
        double porcentaje = esIztapalapa1 ? BONO_IZTAPALAPA_1_PORCENTAJE : 0.0;

        return new UniversidadCompatibilidadResponse(
                universidad.getId(),
                universidad.getNombre(),
                universidad.getTipo(),
                universidad.getLatitud(),
                universidad.getLongitud(),
                universidad.getSitioWeb(),
                esIztapalapa1,
                porcentaje
        );
    }
}
