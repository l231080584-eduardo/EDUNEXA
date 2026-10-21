package com.enudexa.controller;

import com.enudexa.dto.UniversidadCompatibilidadResponse;
import com.enudexa.dto.CareerCatalogResponse;
import com.enudexa.dto.response.ApiResponse;
import com.enudexa.entity.Universidad;
import com.enudexa.repository.UniversidadRepository;
import com.enudexa.repository.CarreraRepository;
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
    private final CarreraRepository carreraRepository;

    @GetMapping("/carreras")
    public ResponseEntity<ApiResponse<List<CareerCatalogResponse>>> obtenerCatalogoCarreras() {
        List<CareerCatalogResponse> respuesta = carreraRepository.findAll().stream()
                .map(carrera -> new CareerCatalogResponse(
                        carrera.getId(),
                        carrera.getNombre(),
                        carrera.getArea(),
                        carrera.getDescripcion(),
                        carrera.getPerfilEgreso() == null ? null : new CareerCatalogResponse.PerfilEgreso(
                                carrera.getPerfilEgreso().getResumenCompetencias(),
                                carrera.getPerfilEgreso().getConocimientosTecnicos(),
                                carrera.getPerfilEgreso().getHabilidadesBlandas()),
                        carrera.getCampoLaboral() == null ? List.of() : carrera.getCampoLaboral().stream()
                                .map(campo -> new CareerCatalogResponse.CampoLaboral(
                                        campo.getPuestoTrabajo(), campo.getSectorEmpresarial(),
                                        campo.getSalarioPromedioEstimado(), campo.getNivelEmpleabilidad()))
                                .toList()))
                .sorted(Comparator.comparing(CareerCatalogResponse::nombre, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(respuesta, "Catálogo de carreras obtenido correctamente"));
    }

    @GetMapping("/compatibilidad")
    public ResponseEntity<ApiResponse<List<UniversidadCompatibilidadResponse>>> obtenerCompatibilidad() {
        List<UniversidadCompatibilidadResponse> respuesta = universidadRepository.findAll().stream()
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
                universidad.getDireccion(),
                universidad.getSitioWeb(),
                esIztapalapa1,
                porcentaje,
                universidad.getCarreras().stream()
                        .map(carrera -> carrera.getNombre())
                        .filter(nombre -> nombre != null && !nombre.isBlank())
                        .sorted(String.CASE_INSENSITIVE_ORDER)
                        .toList()
        );
    }
}
