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
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Order(3)
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

            // PASO 3: Limpiar duplicados de Iztapalapa 1 antes de procesar el catálogo
            cleanupIztapalapaDuplicates();

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
            int universitiesUpdated = 0;
            int careersCreated = 0;
            int relationsCreated = 0;

            for (JsonNode campus : campusNodes) {
                String nombre = campus.path("nombre").asText();
                String ubicacion = campus.path("ubicacion").asText();
                String fuente = campus.path("fuente").asText();
                JsonNode carrerasNode = campus.path("carreras");

                if (nombre.isBlank()) continue;

                // PASO 1: Upsert en vez de saltar — buscar por nombre normalizado
                // El alias "TecNM Plantel Iztapalapa 1" solo se busca cuando el campus es Iztapalapa
                String normalizedNombre = normalize(nombre);
                boolean isIztapalapaCampus = nombre.contains("Iztapalapa") && !nombre.contains("II") && !nombre.contains("III");
                Universidad existingUni = universidadRepository.findAll().stream()
                        .filter(u -> {
                            String uNorm = normalize(u.getNombre());
                            if (uNorm.equals(normalizedNombre)) return true;
                            // Alias solo para Iztapalapa
                            if (isIztapalapaCampus && uNorm.equals("tecnm plantel iztapalapa 1")) return true;
                            return false;
                        })
                        .findFirst()
                        .orElse(null);

                if (existingUni != null) {
                    // Actualizar el registro existente (upsert)
                    if (normalize(existingUni.getNombre()).equals("tecnm plantel iztapalapa 1")) {
                        // Es el alias viejo, renombrar al nombre oficial
                        existingUni.setNombre(nombre);
                        log.info("Alias actualizado: TecNM Plantel Iztapalapa 1 -> {}", nombre);
                    }
                    existingUni.setLatitud(coordinatesForCampus(nombre).lat());
                    existingUni.setLongitud(coordinatesForCampus(nombre).lng());
                    existingUni.setDireccion(ubicacion);
                    existingUni.setSitioWeb(fuente);
                    existingUni.setTipo("Instituto tecnológico");

                    boolean esIztapalapa1 = nombre.contains("Iztapalapa") && !nombre.contains("II") && !nombre.contains("III")
                            && ubicacion.contains("Telecomunicaciones");
                    existingUni.setEsTecnmIztapalapa1(esIztapalapa1);

                    // Actualizar carreras (conservar nombre completo con modalidad)
                    Set<Carrera> carrerasSet = new HashSet<>();
                    if (carrerasNode.isArray()) {
                        for (JsonNode carreraNode : carrerasNode) {
                            String carreraNombre = carreraNode.asText();
                            if (carreraNombre.isBlank()) continue;
                            String carreraCompleta = carreraNombre.trim();
                            String normalizedCarrera = normalize(carreraCompleta);
                            Carrera carrera = careersByName.get(normalizedCarrera);
                            if (carrera == null) {
                                String area = determineArea(carreraCompleta);
                                carrera = new Carrera();
                                carrera.setNombre(carreraCompleta);
                                carrera.setArea(area);
                                carrera = carreraRepository.save(carrera);
                                careersByName.put(normalizedCarrera, carrera);
                                careersCreated++;
                            }
                            carrerasSet.add(carrera);
                        }
                    }
                    existingUni.setCarreras(carrerasSet);
                    universidadRepository.save(existingUni);
                    universitiesUpdated++;
                    relationsCreated += carrerasSet.size();
                    log.info("Universidad TecNM actualizada (upsert): {} ({} carreras)", nombre, carrerasSet.size());

                    // PASO 3 especial: si es Iztapalapa, asegurar exactamente 4 carreras
                    if (esIztapalapa1) {
                        ensureIztapalapaExactCareers(existingUni, careersByName);
                    }
                    continue;
                }

                // No existe, crear nueva
                boolean esIztapalapa1 = nombre.contains("Iztapalapa") && !nombre.contains("II") && !nombre.contains("III")
                        && ubicacion.contains("Telecomunicaciones");

                Set<Carrera> carrerasSet = new HashSet<>();
                if (carrerasNode.isArray()) {
                    for (JsonNode carreraNode : carrerasNode) {
                        String carreraNombre = carreraNode.asText();
                        if (carreraNombre.isBlank()) continue;

                        String carreraCompleta = carreraNombre.trim();
                        String normalizedCarrera = normalize(carreraCompleta);

                        Carrera carrera = careersByName.get(normalizedCarrera);
                        if (carrera == null) {
                            String area = determineArea(carreraCompleta);
                            carrera = new Carrera();
                            carrera.setNombre(carreraCompleta);
                            carrera.setArea(area);
                            carrera = carreraRepository.save(carrera);
                            careersByName.put(normalizedCarrera, carrera);
                            careersCreated++;
                            log.debug("Carrera creada: {} (area: {})", carreraCompleta, area);
                        }
                        carrerasSet.add(carrera);
                    }
                }

                Coordinates coords = coordinatesForCampus(nombre);

                Universidad universidad = Universidad.builder()
                        .nombre(nombre)
                        .tipo("Instituto tecnológico")
                        .latitud(coords.lat())
                        .longitud(coords.lng())
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

            // Limpiar relaciones extra de los 22 campus
            cleanupExtraRelations();

            log.info("Catálogo TecNM cargado: {} creadas, {} actualizadas, {} carreras nuevas, {} relaciones",
                    universitiesCreated, universitiesUpdated, careersCreated, relationsCreated);
        } catch (IOException e) {
            log.error("Error al cargar catálogo TecNM: {}", e.getMessage(), e);
        }
    }

    /**
     * PASO 3: Eliminar duplicados de Iztapapa 1 antes de procesar el catálogo.
     * Si hay dos registros con esTecnmIztapalapa1=true, se elimina el viejo "TecNM Plantel Iztapalapa 1"
     * con todas sus relaciones de carrera.
     */
    private void cleanupIztapalapaDuplicates() {
        List<Universidad> iztapalapaList = universidadRepository.findByEsTecnmIztapalapa1True();
        if (iztapalapaList.size() <= 1) {
            return;
        }
        log.warn("Detectados {} duplicados de Iztapalapa 1, limpiando...", iztapalapaList.size());

        // Buscar el registro del catálogo (nombre oficial) y el viejo alias
        Universidad catalogVersion = null;
        Universidad oldAlias = null;
        for (Universidad u : iztapalapaList) {
            String norm = normalize(u.getNombre());
            if (norm.equals("instituto tecnologico de iztapalapa") && !norm.equals("tecnm plantel iztapalapa 1")) {
                catalogVersion = u;
            } else if (norm.equals("tecnm plantel iztapalapa 1")) {
                oldAlias = u;
            }
        }

        // Si hay el alias viejo, eliminarlo con sus relaciones
        if (oldAlias != null) {
            log.info("Eliminando duplicado viejo: {} (id: {})", oldAlias.getNombre(), oldAlias.getId());
            // Primero limpiar las relaciones de carrera
            oldAlias.setCarreras(new HashSet<>());
            universidadRepository.save(oldAlias);
            universidadRepository.delete(oldAlias);
            log.info("Duplicado eliminado y relaciones limpiadas.");
        } else if (iztapalapaList.size() > 1) {
            // Si hay más de uno y no es el alias conocido, quedarse con el primero y eliminar los demás
            Universidad keep = iztapalapaList.get(0);
            for (int i = 1; i < iztapalapaList.size(); i++) {
                Universidad toDelete = iztapalapaList.get(i);
                log.info("Eliminando duplicado extra: {} (id: {})", toDelete.getNombre(), toDelete.getId());
                toDelete.setCarreras(new HashSet<>());
                universidadRepository.save(toDelete);
                universidadRepository.delete(toDelete);
            }
        }
    }

    /**
     * PASO 3: Asegurar que Iztapalapa tenga exactamente 4 carreras y ninguna otra.
     */
    private void ensureIztapalapaExactCareers(Universidad universidad, java.util.Map<String, Carrera> careersByName) {
        String[] exactCareers = {
                "Ingeniería en Sistemas Computacionales",
                "Ingeniería Industrial",
                "Ingeniería Mecatrónica",
                "Ingeniería en Gestión Empresarial"
        };

        Set<Carrera> exactSet = new HashSet<>();
        for (String careerName : exactCareers) {
            Carrera c = careersByName.get(normalize(careerName));
            if (c != null) {
                exactSet.add(c);
            } else {
                log.warn("Carrera no encontrada para Iztapalapa: {}", careerName);
            }
        }

        // Reemplazar todas las carreras con exactamente estas 4
        universidad.setCarreras(exactSet);
        universidadRepository.save(universidad);
        log.info("Iztapalapa 1 carreras aseguradas: {} ({} carreras)", universidad.getNombre(), exactSet.size());
    }

    /**
     * Al final del seeder, para cada uno de los 22 campus, eliminar las relaciones
     * universidad-carrera que no estén en el catálogo (por nombre completo con modalidad).
     * Esto limpia cualquier relación que la ingesta del SIC haya agregado.
     */
    private void cleanupExtraRelations() {
        // Recargar el catálogo para obtener los nombres completos de carreras por campus
        try (InputStream is = new ClassPathResource("data/tecnmCatalog.json").getInputStream()) {
            JsonNode catalog = objectMapper.readTree(is);
            JsonNode campusNodes = catalog.path("campus");
            if (!campusNodes.isArray()) return;

            // Cargar todas las carreras en un mapa por nombre normalizado
            java.util.Map<String, Carrera> allCareers = new java.util.HashMap<>();
            carreraRepository.findAll().forEach(c -> {
                allCareers.put(normalize(c.getNombre()), c);
            });

            for (JsonNode campus : campusNodes) {
                String nombre = campus.path("nombre").asText();
                if (nombre.isBlank()) continue;

                Universidad uni = universidadRepository.findAll().stream()
                        .filter(u -> normalize(u.getNombre()).equals(normalize(nombre)))
                        .findFirst().orElse(null);
                if (uni == null) continue;

                // Obtener las carreras del catálogo para este campus (nombre completo)
                Set<UUID> catalogCareerIds = new HashSet<>();
                JsonNode carrerasNode = campus.path("carreras");
                if (carrerasNode.isArray()) {
                    for (JsonNode carreraNode : carrerasNode) {
                        String carreraNombre = carreraNode.asText().trim();
                        Carrera c = allCareers.get(normalize(carreraNombre));
                        if (c != null) {
                            catalogCareerIds.add(c.getId());
                        }
                    }
                }

                // Obtener las carreras actuales de la universidad
                Set<UUID> currentCareerIds = uni.getCarreras().stream()
                        .map(Carrera::getId)
                        .collect(Collectors.toSet());

                // Eliminar las que no están en el catálogo
                currentCareerIds.removeAll(catalogCareerIds);
                if (!currentCareerIds.isEmpty()) {
                    log.info("Eliminando {} carreras extra de {}", currentCareerIds.size(), nombre);
                    uni.getCarreras().removeIf(c -> !catalogCareerIds.contains(c.getId()));
                    universidadRepository.save(uni);
                }
            }
        } catch (IOException e) {
            log.warn("Error al limpiar relaciones extra: {}", e.getMessage());
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

    private Coordinates coordinatesForCampus(String nombre) {
        return switch (nombre) {
            case "Instituto Tecnológico de Álvaro Obregón" ->
                    new Coordinates(19.3582, -99.2395);
            case "Instituto Tecnológico de Gustavo A. Madero" ->
                    new Coordinates(19.4622, -99.0618);
            case "Instituto Tecnológico de Gustavo A. Madero II" ->
                    new Coordinates(19.5540, -99.1475);
            case "Instituto Tecnológico de Iztapalapa" ->
                    new Coordinates(19.3800, -99.0528);
            case "Instituto Tecnológico de Iztapalapa II" ->
                    new Coordinates(19.3345, -98.9978);
            case "Instituto Tecnológico de Iztapalapa III" ->
                    new Coordinates(19.3364, -98.9852);
            case "Instituto Tecnológico de Milpa Alta" ->
                    new Coordinates(19.1930, -99.0975);
            case "Instituto Tecnológico de Milpa Alta II" ->
                    new Coordinates(19.1923, -98.9915);
            case "Instituto Tecnológico de Tláhuac" ->
                    new Coordinates(19.2895, -98.9986);
            case "Instituto Tecnológico de Tláhuac II" ->
                    new Coordinates(19.2317, -98.9914);
            case "Instituto Tecnológico de Tláhuac III" ->
                    new Coordinates(19.2800, -99.0572);
            case "Instituto Tecnológico de Tlalpan" ->
                    new Coordinates(19.1967, -99.1422);
            case "Instituto Tecnológico de Tlalnepantla" ->
                    new Coordinates(19.5334, -99.1869);
            case "Tecnológico de Estudios Superiores de Chalco" ->
                    new Coordinates(19.2324, -98.8416);
            case "Tecnológico de Estudios Superiores de Chicoloapan" ->
                    new Coordinates(19.4107, -98.8715);
            case "Tecnológico de Estudios Superiores de Chimalhuacán" ->
                    new Coordinates(19.4128, -98.9296);
            case "Tecnológico de Estudios Superiores de Coacalco" ->
                    new Coordinates(19.6305, -99.1061);
            case "Tecnológico de Estudios Superiores de Cuautitlán Izcalli" ->
                    new Coordinates(19.6466, -99.2284);
            case "Tecnológico de Estudios Superiores de Ecatepec" ->
                    new Coordinates(19.5105, -99.0404);
            case "Tecnológico de Estudios Superiores de Huixquilucan" ->
                    new Coordinates(19.4159, -99.3264);
            case "Tecnológico de Estudios Superiores de Ixtapaluca" ->
                    new Coordinates(19.3732, -98.8496);
            case "Tecnológico de Estudios Superiores del Oriente del Estado de México" ->
                    new Coordinates(19.3429, -98.9539);
            default -> {
                log.warn("Campus sin coordenada verificada: {}", nombre);
                yield new Coordinates(19.4326, -99.1332);
            }
        };
    }
}
