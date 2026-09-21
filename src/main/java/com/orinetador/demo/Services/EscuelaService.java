package com.orinetador.demo.Services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class EscuelaService {

    private final RestClient restClient;

    private static final String API_URL =
            "https://datos.cdmx.gob.mx/dataset/5a8518f0-6dc2-4403-9ad3-2864691de0d1/resource/a9004c49-027c-444d-a9f5-a82fe4208254/download/a9004c49-027c-444d-a9f5-a82fe4208254.json";

    public EscuelaService(RestClient.Builder builder) {
        this.restClient = builder.build();
    }

    public List<Map<String, Object>> buscarEscuelas(String criterio) {

        Map<String, Object> respuesta = restClient.get()
                .uri(API_URL)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> resultados = new ArrayList<>();

        if (respuesta == null || !respuesta.containsKey("features")) {
            return resultados;
        }

        List<Map<String, Object>> features =
                (List<Map<String, Object>>) respuesta.get("features");

        String criterioBusqueda = criterio.toLowerCase();

        for (Map<String, Object> feature : features) {

            Map<String, Object> properties =
                    (Map<String, Object>) feature.get("properties");

            if (properties == null) {
                continue;
            }

            String nombre = String.valueOf(
                    properties.getOrDefault("CENTRO_EDU", "")
            );

            if (nombre.toLowerCase().contains(criterioBusqueda)) {

                Map<String, Object> escuela = new java.util.LinkedHashMap<>();

                escuela.put("id", properties.get("ID"));
                escuela.put("nombre", nombre);
                escuela.put("nivel", properties.get("NIVEL_EDUC"));
                escuela.put("servicio", properties.get("SERVICIO_E"));
                escuela.put("entidad", properties.get("ENTIDAD"));
                escuela.put("municipio", properties.get("MUNICIPIO"));
                escuela.put("control", properties.get("CONTROL"));
                escuela.put("domicilio", properties.get("DOMICILIO"));
                escuela.put("telefono", properties.get("TELEFONO"));
                escuela.put("correo", properties.get("CORREO_ELE"));
                escuela.put("latitud", properties.get("LATITUD"));
                escuela.put("longitud", properties.get("LONGITUD"));

                resultados.add(escuela);
            }
        }

        return resultados;
    }
}