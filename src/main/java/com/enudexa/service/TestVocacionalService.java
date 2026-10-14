package com.enudexa.service;

import com.enudexa.dto.EvaluacionArcadeResponseDTO;
import com.enudexa.dto.TestEvaluationRequest;
import com.enudexa.entity.CampoLaboral;
import com.enudexa.entity.Carrera;
import com.enudexa.entity.PerfilEgreso;
import com.enudexa.entity.Universidad;
import com.enudexa.repository.CarreraRepository;
import com.enudexa.repository.UniversidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TestVocacionalService {

    private final CarreraRepository carreraRepository;
    private final UniversidadRepository universidadRepository;
    private final NoniAiService noniAiService;

    @Transactional(readOnly = true)
    public EvaluacionArcadeResponseDTO procesarEvaluacionArcade(TestEvaluationRequest request, String nickname) {
        List<Carrera> carreras = carreraRepository.findAll();
        if (carreras.isEmpty()) {
            throw new IllegalStateException("Catálogo de carreras no disponible.");
        }

        Carrera mejorCarrera = carreras.stream()
                .min(Comparator.comparingDouble(carrera -> calcularDiferencia(carrera, request)))
                .orElseThrow(() -> new IllegalStateException("No fue posible determinar una carrera compatible."));
        double diferencia = calcularDiferencia(mejorCarrera, request);
        double compatibilidad = Math.max(75.0, (1.0 - diferencia) * 100.0);

        Universidad mejorUniversidad = seleccionarUniversidad(mejorCarrera);
        List<String> badges = new ArrayList<>(List.of("Simulación Completada"));
        if (request.materias() >= 0.8) {
            badges.add("Mente Maestra");
        }
        if (request.intereses() >= 0.8) {
            badges.add("Visionario del Futuro");
        }
        if (request.geolocalizacion() >= 0.7) {
            badges.add("Explorador CDMX");
        }

        return EvaluacionArcadeResponseDTO.builder()
                .nickname(nickname != null && !nickname.isBlank() ? nickname.trim() : "NUEVO-PL4YER")
                .scoreTotal((int) (compatibilidad * 1000))
                .badgesUnlocked(badges)
                .logicaYAlgoritmos((int) (request.materias() * 100))
                .ingenieriaYHardware((int) (request.intereses() * 90))
                .gestionYLiderazgo((int) (request.estiloVida() * 85))
                .innovacionYCreatividad((int) (request.intereses() * 95))
                .noniNarrative(noniAiService.generarSintesisVocacional(
                        nickname, mejorCarrera, mejorUniversidad, compatibilidad))
                .carreraRecomendada(mapCarrera(mejorCarrera))
                .universidadRecomendada(mapUniversidad(mejorUniversidad))
                .build();
    }

    private double calcularDiferencia(Carrera carrera, TestEvaluationRequest request) {
        return Math.abs(carrera.getPesoIntereses() - request.intereses()) * 0.35
                + Math.abs(carrera.getPesoMaterias() - request.materias()) * 0.35
                + Math.abs(carrera.getPesoEstiloVida() - request.estiloVida()) * 0.15
                + Math.abs(carrera.getPesoGeolocalizacion() - request.geolocalizacion()) * 0.15;
    }

    private Universidad seleccionarUniversidad(Carrera carrera) {
        Comparator<Universidad> prioridad = Comparator
                .comparing(Universidad::isEsTecnmIztapalapa1).reversed()
                .thenComparing(Universidad::getNombre, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));

        Universidad elegida = carrera.getUniversidades().stream()
                .min(prioridad)
                .orElseGet(() -> universidadRepository.findAll().stream().min(prioridad).orElse(null));
        if (elegida == null) {
            throw new IllegalStateException("No hay universidades disponibles para recomendar.");
        }
        return elegida;
    }

    private EvaluacionArcadeResponseDTO.CarreraDetalleDTO mapCarrera(Carrera carrera) {
        PerfilEgreso perfil = carrera.getPerfilEgreso();
        List<CampoLaboral> campos = carrera.getCampoLaboral();
        return EvaluacionArcadeResponseDTO.CarreraDetalleDTO.builder()
                .id(carrera.getId().toString())
                .nombre(carrera.getNombre())
                .area(carrera.getArea())
                .duracionSemestres(carrera.getDuracionSemestres())
                .descripcion(carrera.getDescripcion())
                .perfilEgreso(perfil == null ? null : EvaluacionArcadeResponseDTO.PerfilEgresoDTO.builder()
                        .resumenCompetencias(perfil.getResumenCompetencias())
                        .conocimientosTecnicos(perfil.getConocimientosTecnicos())
                        .habilidadesBlandas(perfil.getHabilidadesBlandas())
                        .build())
                .oportunidadesLaborales(campos == null ? List.of() : campos.stream()
                        .map(campo -> EvaluacionArcadeResponseDTO.CampoLaboralDTO.builder()
                                .puestoTrabajo(campo.getPuestoTrabajo())
                                .sectorEmpresarial(campo.getSectorEmpresarial())
                                .salarioPromedioEstimado(campo.getSalarioPromedioEstimado())
                                .nivelEmpleabilidad(campo.getNivelEmpleabilidad())
                                .build())
                        .toList())
                .build();
    }

    private EvaluacionArcadeResponseDTO.UniversidadDetalleDTO mapUniversidad(Universidad universidad) {
        String mapa = universidad.getLatitud() != null && universidad.getLongitud() != null
                ? String.format(Locale.ROOT, "https://www.google.com/maps/search/?api=1&query=%s,%s",
                universidad.getLatitud(), universidad.getLongitud())
                : "";
        return EvaluacionArcadeResponseDTO.UniversidadDetalleDTO.builder()
                .id(universidad.getId().toString())
                .nombre(universidad.getNombre())
                .tipo(universidad.getTipo())
                .latitud(universidad.getLatitud())
                .longitud(universidad.getLongitud())
                .sitioWeb(universidad.getSitioWeb())
                .esTecnmIztapalapa1(universidad.isEsTecnmIztapalapa1())
                .urlMapaInteractivo(mapa)
                .build();
    }
}
