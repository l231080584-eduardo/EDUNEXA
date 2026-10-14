package com.enudexa.service;

import com.enudexa.dto.EvaluacionArcadeResponseDTO;
import com.enudexa.dto.TestEvaluationRequest;
import com.enudexa.entity.CampoLaboral;
import com.enudexa.entity.Carrera;
import com.enudexa.entity.PerfilEgreso;
import com.enudexa.entity.Universidad;
import com.enudexa.repository.CarreraRepository;
import com.enudexa.repository.UniversidadRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestVocacionalServiceTest {

    @Mock
    private CarreraRepository carreraRepository;

    @Mock
    private UniversidadRepository universidadRepository;

    @Test
    void devuelveCarreraUniversidadMapaYNarrativaDeNoni() {
        Universidad universidad = Universidad.builder()
                .id(UUID.randomUUID())
                .nombre("TecNM Iztapalapa I")
                .tipo("Tecnológico")
                .latitud(19.36)
                .longitud(-99.08)
                .esTecnmIztapalapa1(true)
                .build();
        Carrera carrera = Carrera.builder()
                .id(UUID.randomUUID())
                .nombre("Ingeniería en Sistemas Computacionales")
                .area("Tecnología y Software")
                .duracionSemestres(9)
                .descripcion("Software y sistemas.")
                .pesoIntereses(0.95)
                .pesoMaterias(0.90)
                .pesoEstiloVida(0.80)
                .pesoGeolocalizacion(0.85)
                .perfilEgreso(PerfilEgreso.builder()
                        .resumenCompetencias("Análisis")
                        .conocimientosTecnicos("Java")
                        .habilidadesBlandas("Colaboración")
                        .build())
                .campoLaboral(List.of(CampoLaboral.builder()
                        .puestoTrabajo("Ingeniero Full-Stack")
                        .sectorEmpresarial("Tecnología")
                        .salarioPromedioEstimado(38000.0)
                        .nivelEmpleabilidad("Muy Alto")
                        .build()))
                .universidades(Set.of(universidad))
                .build();
        when(carreraRepository.findAll()).thenReturn(List.of(carrera));

        TestVocacionalService service = new TestVocacionalService(
                carreraRepository, universidadRepository, new NoniAiService());
        EvaluacionArcadeResponseDTO resultado = service.procesarEvaluacionArcade(
                new TestEvaluationRequest(UUID.randomUUID(), 0.95, 0.90, 0.80, 0.85,
                        false, null, null, null),
                "Ada");

        assertEquals("Ada", resultado.getNickname());
        assertEquals(carrera.getNombre(), resultado.getCarreraRecomendada().getNombre());
        assertEquals("Java", resultado.getCarreraRecomendada().getPerfilEgreso().getConocimientosTecnicos());
        assertEquals(38000.0,
                resultado.getCarreraRecomendada().getOportunidadesLaborales().get(0).getSalarioPromedioEstimado());
        assertTrue(resultado.getUniversidadRecomendada().isEsTecnmIztapalapa1());
        assertEquals("https://www.google.com/maps/search/?api=1&query=19.36,-99.08",
                resultado.getUniversidadRecomendada().getUrlMapaInteractivo());
        assertTrue(resultado.getNoniNarrative().contains("Hola, Ada"));
    }

    @Test
    void fallaConMensajeClaroSiNoHayUniversidadesParaRecomendar() {
        Carrera carrera = Carrera.builder()
                .id(UUID.randomUUID())
                .nombre("Ingeniería en Sistemas Computacionales")
                .area("Tecnología y Software")
                .pesoIntereses(0.95)
                .pesoMaterias(0.90)
                .pesoEstiloVida(0.80)
                .pesoGeolocalizacion(0.85)
                .universidades(Set.of())
                .build();
        when(carreraRepository.findAll()).thenReturn(List.of(carrera));
        when(universidadRepository.findAll()).thenReturn(List.of());

        TestVocacionalService service = new TestVocacionalService(
                carreraRepository, universidadRepository, new NoniAiService());

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> service.procesarEvaluacionArcade(
                        new TestEvaluationRequest(UUID.randomUUID(), 0.95, 0.90, 0.80, 0.85,
                                false, null, null, null),
                        "Ada"));

        assertEquals("No hay universidades disponibles para recomendar.", exception.getMessage());
    }
}
