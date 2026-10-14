package com.enudexa.service;

import com.enudexa.exception.ExternalServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Order(2)
public class UniversidadIngestionService implements CommandLineRunner {

    private final RestClient restClient;
    private final IngestionService ingestionService;
    private final String apiUrl;

    @Value("${enudexa.ingestion.solo-tecnm:false}")
    private boolean soloTecnm;

    public UniversidadIngestionService(
            RestClient.Builder restClientBuilder,
            IngestionService ingestionService,
            @Value("${external.api.url:https://datos.cdmx.gob.mx/dataset/5a8518f0-6dc2-4403-9ad3-2864691de0d1/resource/a9004c49-027c-444d-a9f5-a82fe4208254/download/a9004c49-027c-444d-a9f5-a82fe4208254.json}")
            String apiUrl) {
        this.restClient = restClientBuilder.build();
        this.ingestionService = ingestionService;
        this.apiUrl = apiUrl;
    }

    @Override
    public void run(String... args) {
        Map<?, ?> respuesta;
        try {
            respuesta = restClient.get().uri(apiUrl).retrieve().body(Map.class);
        } catch (RestClientException exception) {
            throw new ExternalServiceException("Falló la consulta al servicio externo de universidades", exception);
        }
        if (respuesta == null || !(respuesta.get("features") instanceof List<?> features)) {
            return;
        }

        List<UniversidadIngestionDto> universidades = new ArrayList<>();
        for (Object feature : features) {
            if (!(feature instanceof Map<?, ?> featureMap)
                    || !(featureMap.get("properties") instanceof Map<?, ?> properties)) {
                continue;
            }
            String nombre = texto(properties.get("CENTRO_EDU"));
            if (nombre.isBlank() || !debeIncluir(nombre)) {
                continue;
            }

            String nombreNormalizado = nombre.toUpperCase(Locale.ROOT);
            boolean iztapalapa = nombreNormalizado.contains("IZTAPALAPA");
            boolean otroPlantel = nombreNormalizado.contains("IZTAPALAPA II")
                    || nombreNormalizado.contains("IZTAPALAPA III")
                    || nombreNormalizado.contains("IZTAPALAPA 2")
                    || nombreNormalizado.contains("IZTAPALAPA 3");

            universidades.add(new UniversidadIngestionDto(
                    nombre,
                    texto(properties.get("NIVEL_EDUC")),
                    decimal(properties.get("LATITUD")),
                    decimal(properties.get("LONGITUD")),
                    texto(properties.get("SITIO_WEB")),
                    iztapalapa && !otroPlantel,
                    carreras(properties.get("CARRERAS"))));
        }
        ingestionService.procesarIngestion(universidades);
    }

    private boolean debeIncluir(String nombre) {
        if (!soloTecnm) {
            return true;
        }
        String normalizado = nombre.toUpperCase(Locale.ROOT);
        return normalizado.contains("TECNOLÓGICO NACIONAL DE MÉXICO")
                || normalizado.contains("INSTITUTO TECNOLÓGICO")
                || normalizado.contains("INSTITUTO TECNOLOGICO")
                || normalizado.contains("TECNM");
    }

    private String texto(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private Double decimal(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return value == null || value.toString().isBlank() ? null : Double.valueOf(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private List<CarreraIngestionDto> carreras(Object value) {
        if (value instanceof List<?> values) {
            return values.stream()
                    .map(this::carrera)
                    .filter(carrera -> !carrera.nombre().isBlank())
                    .toList();
        }
        if (value instanceof String nombres && !nombres.isBlank()) {
            return java.util.Arrays.stream(nombres.split("[;,|]"))
                    .map(String::trim)
                    .filter(nombre -> !nombre.isBlank())
                    .map(nombre -> new CarreraIngestionDto(nombre, "Por clasificar"))
                    .toList();
        }
        return List.of();
    }

    private CarreraIngestionDto carrera(Object value) {
        if (value instanceof Map<?, ?> carrera) {
            return new CarreraIngestionDto(
                    texto(carrera.get("nombre")),
                    texto(carrera.get("area")).isBlank() ? "Por clasificar" : texto(carrera.get("area")));
        }
        return new CarreraIngestionDto(texto(value), "Por clasificar");
    }
}
