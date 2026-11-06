package com.enudexa.service;

import com.enudexa.entity.Carrera;
import com.enudexa.entity.Universidad;
import com.enudexa.repository.CarreraRepository;
import com.enudexa.repository.UniversidadRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class TecnmCatalogSeeder implements CommandLineRunner {

    private final CarreraRepository carreraRepository;
    private final UniversidadRepository universidadRepository;
    private final ObjectMapper objectMapper;

    private static final String[] CATEGORY_KEYWORDS_TECH = {"sistemas", "computacional", "informática", "informatica",
            "software", "datos", "ciberseguridad", "semiconductores", "desarrollo de aplicaciones",
            "tecnologías de la información", "tecnologias de la información", "inteligencia artificial",
            "bioquímica", "biotecnología", "biomédica", "biomedica", "electrónica", "electronica"};
    private static final String[] CATEGORY_KEYWORDS_ENGINEERING = {"industrial", "mecatrónica", "mechatronica",
            "mecánica", "mecanica", "civil", "química", "quimica", "ambiental", "ferroviaria",
            "logística", "logistica", "electromecánica", "electromecanica", "energías", "energias",
            "materiales", "aeronáutica", "aeronautica", "automotrices", "industrias alimentarias",
            "animación digital", "animacion digital", "desarrollo comunitario"};
    private static final String[] CATEGORY_KEYWORDS_DESIGN = {"arquitectura", "diseño", "diseno", "comunicación visual",
            "comunicacion visual"};
    private static final String[] CATEGORY_KEYWORDS_BUSINESS = {"gestión empresarial", "gestion empresarial",
            "administración", "administracion", "finanzas", "contador", "contaduría", "contaduria",
            "logística", "logistica", "turismo"};
    private static final String[] CATEGORY_KEYWORDS_HUMANITIES = {"gastronomía", "gastronomia", "biología",
            "biologia", "pedagogía", "pedagogia", "desarrollo comunitario"};
    private static final String[] CATEGORY_KEYWORDS_LAW = {"derecho"};
    private static final String[] CATEGORY_KEYWORDS_SOCIAL = {"salud", "enfermería", "enfermeria", "medicina",
            "psicología", "psicologia"};

    @Override
    @Transactional
    public void run(String... args) {
        try {
            log.info("Cargando catálogo TecNM desde JSON...");
            JsonNode catalog;
            try (InputStream is = new ClassPathResource("data/tecnmCatalog.json").getInputStream()) {
                catalog = objectMapper.readTree(is);
            }
            JsonNode campusNodes = catalog.path("campus");
            if (!campusNodes.isArray()) {
                log.warn("Catálogo TecNM no contiene array de campus, omitiendo.");
                return;
            }

            // Load all existing careers into a map for lookup
            java.util.Map<String, Carrera> careersByName = new java.util.HashMap<>();
            carreraRepository.findAll().forEach(c -> {
                String key = normalize(c.getNombre());
                careersByName.putIfAbsent(key, c);
            });

            int universitiesCreated = 0;
            int careersCreated = 0;
            int relationsCreated = 0;

            for (JsonNode campus : campusNodes) {
                String nombre = campus.path("nombre").asText();
                String ubicacion = campus.path("ubicacion").asText();
                String fuente = campus.path("fuente").asText();
                JsonNode carrerasNode = campus.path("carreras");

                if (nombre.isBlank()) continue;

                // Check if university already exists
                String normalizedNombre = normalize(nombre);
                boolean exists = universidadRepository.findAll().stream()
                        .anyMatch(u -> normalize(u.getNombre()).equals(normalizedNombre));

                if (exists) {
                    log.debug("Universidad ya existe: {}", nombre);
                    continue;
                }

                // Determine if this is Iztapalapa 1
                boolean esIztapalapa1 = nombre.contains("Iztapalapa") && !nombre.contains("II") && !nombre.contains("III")
                        && ubicacion.contains("Telecomunicaciones");

                // Create careers for this campus
                Set<Carrera> carrerasSet = new HashSet<>();
                if (carrerasNode.isArray()) {
                    for (JsonNode carreraNode : carrerasNode) {
                        String carreraNombre = carreraNode.asText();
                        if (carreraNombre.isBlank()) continue;

                        // Skip virtual/distance variants for the main career entry
                        String carreraBase = carreraNombre.replaceAll("\\s*\\(.*?\\)", "").trim();
                        String normalizedCarrera = normalize(carreraBase);

                        // Find or create the career
                        Carrera carrera = careersByName.get(normalizedCarrera);
                        if (carrera == null) {
                            String area = determineArea(carreraBase);
                            carrera = new Carrera();
                            carrera.setNombre(carreraBase);
                            carrera.setArea(area);
                            carrera = carreraRepository.save(carrera);
                            careersByName.put(normalizedCarrera, carrera);
                            careersCreated++;
                            log.debug("Carrera creada: {} (area: {})", carreraBase, area);
                        }
                        carrerasSet.add(carrera);
                    }
                }

                // Extract coordinates from location if possible
                Double lat = null;
                Double lng = null;
                Coordinates coords = estimateCoordinates(ubicacion);
                lat = coords.lat();
                lng = coords.lng();

                // Create university
                Universidad universidad = Universidad.builder()
                        .nombre(nombre)
                        .tipo("Instituto tecnológico")
                        .latitud(lat)
                        .longitud(lng)
                        .direccion(ubicacion)
                        .sitioWeb(fuente)
                        .esTecnmIztapalapa1(esIztapalapa1)
                        .carreras(carrerasSet)
                        .build();

                universidadRepository.save(universidad);
                universitiesCreated++;
                relationsCreated += carrerasSet.size();
                log.info("Universidad TecNM creada: {} ({} carreras)", nombre, carrerasSet.size());
            }

            log.info("Catálogo TecNM cargado: {} universidades, {} carreras nuevas, {} relaciones",
                    universitiesCreated, careersCreated, relationsCreated);
        } catch (IOException e) {
            log.error("Error al cargar catálogo TecNM: {}", e.getMessage(), e);
        }
    }

    private String determineArea(String carreraNombre) {
        String normalized = normalize(carreraNombre);

        for (String keyword : CATEGORY_KEYWORDS_TECH) {
            if (normalized.contains(keyword)) return "tech";
        }
        for (String keyword : CATEGORY_KEYWORDS_ENGINEERING) {
            if (normalized.contains(keyword)) return "engineering";
        }
        for (String keyword : CATEGORY_KEYWORDS_DESIGN) {
            if (normalized.contains(keyword)) return "design";
        }
        for (String keyword : CATEGORY_KEYWORDS_BUSINESS) {
            if (normalized.contains(keyword)) return "business";
        }
        for (String keyword : CATEGORY_KEYWORDS_LAW) {
            if (normalized.contains(keyword)) return "law";
        }
        for (String keyword : CATEGORY_KEYWORDS_SOCIAL) {
            if (normalized.contains(keyword)) return "social";
        }
        for (String keyword : CATEGORY_KEYWORDS_HUMANITIES) {
            if (normalized.contains(keyword)) return "humanities";
        }
        return "Por clasificar";
    }

    private String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace("-", " ")
                .replace("_", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private record Coordinates(Double lat, Double lng) {}

    private Coordinates estimateCoordinates(String ubicacion) {
        String normalized = normalize(ubicacion);
        // CDMX
        if (normalized.contains("iztapalapa")) return new Coordinates(19.3562, -99.0141);
        if (normalized.contains("tlalpan")) return new Coordinates(19.2870, -99.1790);
        if (normalized.contains("tlahuac")) return new Coordinates(19.2850, -99.0100);
        if (normalized.contains("milpa alta")) return new Coordinates(19.1850, -98.9400);
        if (normalized.contains("gustavo a. madero") || normalized.contains("gamadero")) return new Coordinates(19.4800, -99.0900);
        if (normalized.contains("álvaro obregón") || normalized.contains("alvaro obregon")) return new Coordinates(19.3550, -99.2000);
        // Estado de México
        if (normalized.contains("tlalnepantla")) return new Coordinates(19.5300, -99.2010);
        if (normalized.contains("chalco")) return new Coordinates(19.2800, -98.9100);
        if (normalized.contains("chicoloapan")) return new Coordinates(19.4500, -98.8800);
        if (normalized.contains("chimalhuacán") || normalized.contains("chimalhuacan")) return new Coordinates(19.4200, -98.9500);
        if (normalized.contains("coacalco")) return new Coordinates(19.6300, -99.1000);
        if (normalized.contains("cuautitlán") || normalized.contains("cuautitlan")) return new Coordinates(19.6500, -99.1700);
        if (normalized.contains("ecatepec")) return new Coordinates(19.4100, -98.8900);
        if (normalized.contains("huixquilucan")) return new Coordinates(19.2900, -99.2100);
        if (normalized.contains("ixtapaluca")) return new Coordinates(19.3200, -98.7600);
        if (normalized.contains("la paz") || normalized.contains("oriente del estado")) return new Coordinates(19.3500, -98.7000);
        // Default ZMVM center
        return new Coordinates(19.4326, -99.1332);
    }
}
