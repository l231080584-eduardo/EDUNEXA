package com.enudexa.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Order(2)
@Slf4j
@ConditionalOnProperty(name = "enudexa.ingestion.enabled", havingValue = "true", matchIfMissing = true)
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
        Object respuesta;
        try {
            respuesta = restClient.get().uri(apiUrl).retrieve().body(Object.class);
        } catch (RestClientException exception) {
            log.warn("No se pudo actualizar el catálogo externo; se conserva el catálogo local: {}", exception.getMessage());
            return;
        }
        List<UniversidadIngestionDto> universidades = extraerUniversidades(respuesta);
        ingestionService.procesarIngestion(universidades);
        log.info("Catálogo externo procesado: {} instituciones recibidas.", universidades.size());
    }

    private List<UniversidadIngestionDto> extraerUniversidades(Object respuesta) {
        if (respuesta instanceof List<?> records) {
            return records.stream()
                    .filter(Map.class::isInstance)
                    .map(Map.class::cast)
                    .map(this::desdeRegistroNacional)
                    .filter(java.util.Objects::nonNull)
                    .toList();
        }
        if (respuesta instanceof Map<?, ?> geoJson && geoJson.get("features") instanceof List<?> features) {
            return features.stream()
                    .filter(Map.class::isInstance)
                    .map(Map.class::cast)
                    .map(feature -> feature.get("properties"))
                    .filter(Map.class::isInstance)
                    .map(Map.class::cast)
                    .map(this::desdeGeoJson)
                    .filter(java.util.Objects::nonNull)
                    .toList();
        }
        return List.of();
    }

    private UniversidadIngestionDto desdeRegistroNacional(Map<?, ?> row) {
        String nombre = texto(row.get("universidad_nombre"));
        if (nombre.isBlank()) return null;
        String adscripcion = texto(row.get("universidad_adscripcion"));
        if (!debeIncluir(nombre, adscripcion)) return null;

        String direccion = List.of(
                texto(row.get("universidad_calle_numero")), texto(row.get("universidad_colonia")),
                texto(row.get("universidad_cp")), texto(row.get("nom_mun")), texto(row.get("nom_ent")))
                .stream().filter(value -> !value.isBlank()).collect(Collectors.joining(", "));
        return new UniversidadIngestionDto(
                nombre,
                tipoInstitucion(nombre, row.get("universidad_tipo")),
                decimal(row.get("gmaps_latitud")), decimal(row.get("gmaps_longitud")),
                direccion,
                texto(row.get("pagina_web")),
                esPlantelTecnmIztapalapa(nombre, adscripcion),
                List.of());
    }

    private UniversidadIngestionDto desdeGeoJson(Map<?, ?> properties) {
        String nombre = texto(properties.get("CENTRO_EDU"));
        if (nombre.isBlank()) return null;
        String tipo = texto(properties.get("NIVEL_EDUC"));
        if (!debeIncluir(nombre, tipo)) return null;
        return new UniversidadIngestionDto(nombre, tipo,
                decimal(properties.get("LATITUD")), decimal(properties.get("LONGITUD")),
                texto(properties.get("DIRECCION"), properties.get("DOMICILIO"), properties.get("CALLE_Y_NUMERO")),
                texto(properties.get("SITIO_WEB")), esPlantelTecnmIztapalapa(nombre, tipo),
                carreras(properties.get("CARRERAS")));
    }

    private String tipoInstitucion(String nombre, Object tipo) {
        String value = texto(tipo);
        if (!value.isBlank()) return value;
        String normalizado = nombre.toUpperCase(Locale.ROOT);
        if (normalizado.contains("TECNOLÓGICO") || normalizado.contains("TECNOLOGICO") || normalizado.contains("TECNM")) {
            return "Instituto tecnológico";
        }
        return "Institución de educación superior";
    }

    private boolean esTecnm(String nombre, String adscripcion) {
        String combined = (nombre + " " + adscripcion).toUpperCase(Locale.ROOT);
        return combined.contains("TECNM") || combined.contains("TECNOLÓGICO NACIONAL DE MÉXICO")
                || combined.contains("TECNOLOGICO NACIONAL DE MEXICO")
                || combined.contains("INSTITUTO TECNOLÓGICO") || combined.contains("INSTITUTO TECNOLOGICO");
    }

    private boolean esPlantelTecnmIztapalapa(String nombre, String adscripcion) {
        String combined = (nombre + " " + adscripcion).toUpperCase(Locale.ROOT);
        boolean iztapalapa = combined.contains("IZTAPALAPA");
        boolean target = esTecnm(nombre, adscripcion)
                || combined.contains("INSTITUTO TECNOLÓGICO DE IZTAPALAPA")
                || combined.contains("INSTITUTO TECNOLOGICO DE IZTAPALAPA");
        boolean otroPlantel = combined.contains("IZTAPALAPA II") || combined.contains("IZTAPALAPA III")
                || combined.contains("IZTAPALAPA 2") || combined.contains("IZTAPALAPA 3");
        return iztapalapa && target && !otroPlantel;
    }

    private boolean debeIncluir(String nombre, String adscripcion) {
        if (!soloTecnm) {
            return true;
        }
        return esTecnm(nombre, adscripcion);
    }

    private String texto(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private String texto(Object first, Object second, Object third) {
        for (Object value : new Object[]{first, second, third}) {
            String text = texto(value);
            if (!text.isBlank()) return text;
        }
        return "";
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
