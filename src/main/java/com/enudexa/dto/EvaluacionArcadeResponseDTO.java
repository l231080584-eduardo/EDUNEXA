package com.enudexa.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluacionArcadeResponseDTO {

    private String nickname;
    private Integer scoreTotal;
    private List<String> badgesUnlocked;
    private Integer logicaYAlgoritmos;
    private Integer ingenieriaYHardware;
    private Integer gestionYLiderazgo;
    private Integer innovacionYCreatividad;
    private String noniNarrative;
    private CarreraDetalleDTO carreraRecomendada;
    private UniversidadDetalleDTO universidadRecomendada;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CarreraDetalleDTO {
        private String id;
        private String nombre;
        private String area;
        private Integer duracionSemestres;
        private String descripcion;
        private PerfilEgresoDTO perfilEgreso;
        private List<CampoLaboralDTO> oportunidadesLaborales;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PerfilEgresoDTO {
        private String resumenCompetencias;
        private String conocimientosTecnicos;
        private String habilidadesBlandas;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CampoLaboralDTO {
        private String puestoTrabajo;
        private String sectorEmpresarial;
        private Double salarioPromedioEstimado;
        private String nivelEmpleabilidad;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UniversidadDetalleDTO {
        private String id;
        private String nombre;
        private String tipo;
        private Double latitud;
        private Double longitud;
        private String direccion;
        private String sitioWeb;
        private boolean esTecnmIztapalapa1;
        private String urlMapaInteractivo;
    }
}
