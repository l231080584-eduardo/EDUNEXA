package com.enudexa.service;

import com.enudexa.entity.Universidad;
import com.enudexa.repository.UniversidadRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class UniversidadIngestionService implements CommandLineRunner {

    private static final String API_URL =
            "https://datos.cdmx.gob.mx/dataset/5a8518f0-6dc2-4403-9ad3-2864691de0d1/resource/a9004c49-027c-444d-a9f5-a82fe4208254/download/a9004c49-027c-444d-a9f5-a82fe4208254.json";

    private final RestClient restClient;
    private final UniversidadRepository universidadRepository;

    @Value("${enudexa.ingestion.solo-tecnm:true}")
    private boolean soloTecnm;

    public UniversidadIngestionService(RestClient.Builder restClientBuilder,
                                       UniversidadRepository universidadRepository) {
        this.restClient = restClientBuilder.build();
        this.universidadRepository = universidadRepository;
    }

    @Override
    public void run(String... args) {
        Map<?, ?> respuesta = restClient.get().uri(API_URL).retrieve().body(Map.class);
        if (respuesta == null || !(respuesta.get("features") instanceof List<?> features)) {
            return;
        }

        for (Object feature : features) {
            if (!(feature instanceof Map<?, ?> featureMap)
                    || !(featureMap.get("properties") instanceof Map<?, ?> properties)) {
                continue;
            }
            String nombre = texto(properties.get("CENTRO_EDU"));
            if (nombre.isBlank() || !debeIncluir(nombre) || universidadRepository.existsByNombre(nombre)) {
                continue;
            }

            String nombreNormalizado = nombre.toUpperCase(Locale.ROOT);

            // Filtro preciso: Es Iztapalapa pero descarta explícitamente los planteles II, III, 2 y 3
            boolean esIztapalapa = nombreNormalizado.contains("IZTAPALAPA");
            boolean esOtrosCampuses = nombreNormalizado.contains("IZTAPALAPA II")
                    || nombreNormalizado.contains("IZTAPALAPA III")
                    || nombreNormalizado.contains("IZTAPALAPA 2")
                    || nombreNormalizado.contains("IZTAPALAPA 3");

            boolean esIztapalapa1 = esIztapalapa && !esOtrosCampuses;

            Universidad universidad = Universidad.builder()
                    .nombre(nombre)
                    .tipo(texto(properties.get("NIVEL_EDUC")))
                    .latitud(decimal(properties.get("LATITUD")))
                    .longitud(decimal(properties.get("LONGITUD")))
                    .sitioWeb(texto(properties.get("SITIO_WEB")))
                    .esTecnmIztapalapa1(esIztapalapa1)
                    .build();

            universidadRepository.save(universidad);
        }
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
}