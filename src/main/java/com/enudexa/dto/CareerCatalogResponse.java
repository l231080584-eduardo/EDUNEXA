package com.enudexa.dto;

import java.util.List;
import java.util.UUID;

public record CareerCatalogResponse(
        UUID id,
        String nombre,
        String area,
        String descripcion,
        PerfilEgreso perfilEgreso,
        List<CampoLaboral> campoLaboral
) {
    public record PerfilEgreso(String resumenCompetencias, String conocimientosTecnicos, String habilidadesBlandas) {}
    public record CampoLaboral(String puestoTrabajo, String sectorEmpresarial, Double salarioPromedioEstimado, String nivelEmpleabilidad) {}
}
