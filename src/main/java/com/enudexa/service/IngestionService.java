package com.enudexa.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;

@Service
public class IngestionService {

    private static final int JDBC_BATCH_SIZE = 1000;

    private static final RowMapper<CarreraFila> CARRERA_ROW_MAPPER = (resultSet, rowNumber) ->
            new CarreraFila(
                    UUID.fromString(resultSet.getString("id")),
                    resultSet.getString("nombre"),
                    resultSet.getString("area"));

    private final JdbcTemplate jdbcTemplate;

    public IngestionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void procesarIngestion(List<UniversidadIngestionDto> datos) {
        if (datos == null || datos.isEmpty()) {
            return;
        }

        Map<String, UUID> idsCarrerasPorNombre = new LinkedHashMap<>();
        Map<UUID, String> areasPorCarreraId = new HashMap<>();
        cargarCatalogoCarreras(idsCarrerasPorNombre, areasPorCarreraId);

        Map<String, CarreraIngestionDto> carrerasSolicitadas = new LinkedHashMap<>();
        datos.stream()
                .filter(universidad -> universidad.carreras() != null)
                .flatMap(universidad -> universidad.carreras().stream())
                .filter(carrera -> carrera.nombre() != null && !carrera.nombre().isBlank())
                .forEach(carrera -> carrerasSolicitadas.putIfAbsent(
                        normalizar(carrera.nombre()),
                        new CarreraIngestionDto(carrera.nombre().trim(),
                                carrera.area() == null || carrera.area().isBlank()
                                        ? "Por clasificar" : carrera.area().trim())));

        List<CarreraPersistencia> nuevasCarreras = carrerasSolicitadas.entrySet().stream()
                .filter(entry -> !idsCarrerasPorNombre.containsKey(entry.getKey()))
                .map(entry -> new CarreraPersistencia(
                        UUID.randomUUID(), entry.getValue().nombre(), entry.getValue().area()))
                .toList();
        if (!nuevasCarreras.isEmpty()) {
            jdbcTemplate.batchUpdate(
                    """
                    INSERT INTO carreras (id, nombre, area)
                    SELECT ?, ?, ?
                    WHERE NOT EXISTS (
                        SELECT 1 FROM carreras WITH (UPDLOCK, HOLDLOCK) WHERE nombre = ?
                    )
                    """,
                    nuevasCarreras,
                    JDBC_BATCH_SIZE,
                    (statement, carrera) -> {
                        statement.setString(1, carrera.id().toString());
                        statement.setString(2, carrera.nombre());
                        statement.setString(3, carrera.area());
                        statement.setString(4, carrera.nombre());
                    });
            idsCarrerasPorNombre.clear();
            areasPorCarreraId.clear();
            cargarCatalogoCarreras(idsCarrerasPorNombre, areasPorCarreraId);
        }

        Set<String> nombresExistentes = new HashSet<>();
        jdbcTemplate.query("SELECT nombre FROM universidades", resultSet -> {
            nombresExistentes.add(normalizar(resultSet.getString("nombre")));
        });

        Set<String> nombresEnLote = new HashSet<>();
        List<UniversidadPersistencia> nuevasUniversidades = datos.stream()
                .filter(universidad -> universidad.nombre() != null && !universidad.nombre().isBlank())
                .filter(universidad -> {
                    String nombre = normalizar(universidad.nombre());
                    return !nombresExistentes.contains(nombre) && nombresEnLote.add(nombre);
                })
                .map(universidad -> new UniversidadPersistencia(
                        UUID.randomUUID(),
                        universidad.nombre().trim(),
                        universidad.tipo(),
                        universidad.latitud(),
                        universidad.longitud(),
                        universidad.direccion(),
                        universidad.sitioWeb(),
                        universidad.esTecnmIztapalapa1()))
                .toList();

        if (!nuevasUniversidades.isEmpty()) {
            String insertarUniversidad = """
                    INSERT INTO universidades
                        (id, nombre, tipo, latitud, longitud, direccion, sitio_web, es_tecnm_iztapalapa1)
                    SELECT ?, ?, ?, ?, ?, ?, ?, ?
                    WHERE NOT EXISTS (
                        SELECT 1 FROM universidades WITH (UPDLOCK, HOLDLOCK) WHERE nombre = ?
                    )
                    """;
            jdbcTemplate.batchUpdate(insertarUniversidad, nuevasUniversidades, JDBC_BATCH_SIZE,
                    this::asignarUniversidad);
        }

        List<UniversidadIngestionDto> catalogoActualizado = datos.stream()
                .filter(universidad -> universidad.nombre() != null && !universidad.nombre().isBlank())
                .toList();
        if (!catalogoActualizado.isEmpty()) {
            jdbcTemplate.batchUpdate(
                    """
                    UPDATE universidades
                    SET tipo = COALESCE(NULLIF(?, ''), tipo),
                        latitud = COALESCE(?, latitud),
                        longitud = COALESCE(?, longitud),
                        direccion = COALESCE(NULLIF(?, ''), direccion),
                        sitio_web = COALESCE(NULLIF(?, ''), sitio_web),
                        es_tecnm_iztapalapa1 = CASE WHEN ? = 1 THEN 1 ELSE es_tecnm_iztapalapa1 END
                    WHERE nombre = ?
                    """,
                    catalogoActualizado,
                    JDBC_BATCH_SIZE,
                    (statement, universidad) -> {
                        statement.setString(1, universidad.tipo());
                        if (universidad.latitud() == null) statement.setNull(2, Types.DOUBLE);
                        else statement.setDouble(2, universidad.latitud());
                        if (universidad.longitud() == null) statement.setNull(3, Types.DOUBLE);
                        else statement.setDouble(3, universidad.longitud());
                        statement.setString(4, universidad.direccion());
                        statement.setString(5, universidad.sitioWeb());
                        statement.setBoolean(6, universidad.esTecnmIztapalapa1());
                        statement.setString(7, universidad.nombre());
                    });
        }

        Map<String, UUID> idsUniversidadesPorNombre = new HashMap<>();
        jdbcTemplate.query("SELECT id, nombre FROM universidades", resultSet -> {
            idsUniversidadesPorNombre.putIfAbsent(
                    normalizar(resultSet.getString("nombre")),
                    UUID.fromString(resultSet.getString("id")));
        });

        Set<RelacionUniversidadCarrera> relacionesUnicas = new HashSet<>();
        for (UniversidadIngestionDto universidad : datos) {
            UUID universidadId = idsUniversidadesPorNombre.get(normalizar(universidad.nombre()));
            if (universidadId == null) {
                continue;
            }

            Predicate<String> carreraAplicable = carreraAplicable(universidad.nombre());
            Set<UUID> idsSeleccionados = new HashSet<>(idsCarrerasPorNombre.entrySet().stream()
                    .filter(entry -> carreraAplicable.test(areasPorCarreraId.get(entry.getValue())))
                    .map(Map.Entry::getValue)
                    .toList());
            if (universidad.carreras() != null) {
                universidad.carreras().stream()
                        .map(CarreraIngestionDto::nombre)
                        .filter(nombre -> nombre != null && !nombre.isBlank())
                        .map(nombre -> idsCarrerasPorNombre.get(normalizar(nombre)))
                        .filter(java.util.Objects::nonNull)
                        .forEach(idsSeleccionados::add);
            }
            List<UUID> idsCarrerasUniversidad = List.copyOf(idsSeleccionados);
            for (UUID carreraId : idsCarrerasUniversidad) {
                relacionesUnicas.add(new RelacionUniversidadCarrera(universidadId, carreraId));
            }
        }

        if (!relacionesUnicas.isEmpty()) {
            List<Object[]> relaciones = relacionesUnicas.stream()
                    .map(relacion -> new Object[]{
                            relacion.universidadId(), relacion.carreraId(),
                            relacion.universidadId(), relacion.carreraId()})
                    .toList();
            jdbcTemplate.batchUpdate(
                    """
                    INSERT INTO universidad_carrera (universidad_id, carrera_id)
                    SELECT ?, ?
                    WHERE NOT EXISTS (
                        SELECT 1 FROM universidad_carrera WITH (UPDLOCK, HOLDLOCK)
                        WHERE universidad_id = ? AND carrera_id = ?
                    )
                    """,
                    relaciones,
                    JDBC_BATCH_SIZE,
                    (statement, relacion) -> {
                        statement.setString(1, relacion[0].toString());
                        statement.setString(2, relacion[1].toString());
                        statement.setString(3, relacion[2].toString());
                        statement.setString(4, relacion[3].toString());
                    });
        }
    }

    private void asignarUniversidad(PreparedStatement statement, UniversidadPersistencia universidad)
            throws SQLException {
        statement.setString(1, universidad.id().toString());
        statement.setString(2, universidad.nombre());
        statement.setString(3, universidad.tipo());
        if (universidad.latitud() == null) {
            statement.setNull(4, Types.DOUBLE);
        } else {
            statement.setDouble(4, universidad.latitud());
        }
        if (universidad.longitud() == null) {
            statement.setNull(5, Types.DOUBLE);
        } else {
            statement.setDouble(5, universidad.longitud());
        }
        statement.setString(6, universidad.direccion());
        statement.setString(7, universidad.sitioWeb());
        statement.setBoolean(8, universidad.esTecnmIztapalapa1());
        statement.setString(9, universidad.nombre());
    }

    private Predicate<String> carreraAplicable(String nombreUniversidad) {
        String nombre = normalizar(nombreUniversidad);
        boolean tecnologica = nombre.contains("TECNOLOGICO")
                || nombre.contains("POLITECNICO")
                || nombre.contains("INGENIERIA");
        boolean salud = nombre.contains("SALUD")
                || nombre.contains("MEDIC")
                || nombre.contains("HOSPITAL");
        boolean educacion = nombre.contains("MAESTRO")
                || nombre.contains("NORMAL")
                || nombre.contains("PEDAGOGICA");
        boolean creativa = nombre.contains("ARTE")
                || nombre.contains("DISENO")
                || nombre.contains("CULTUR");
        return areaCarrera -> {
            String area = normalizar(areaCarrera);
            return (tecnologica && (area.contains("TECNOLOGIA")
                    || area.contains("INGENIERIA")
                    || area.contains("AUTOMATIZACION")
                    || area.contains("GESTION")
                    || area.contains("CIENCIAS EXACTAS")
                    || area.contains("INFRAESTRUCTURA")))
                    || (salud && area.contains("SALUD"))
                    || (educacion && area.contains("EDUCACION"))
                    || (creativa && area.contains("CREATIVOS"));
        };
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return "";
        }
        return Normalizer.normalize(valor.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT);
    }

    private void cargarCatalogoCarreras(
            Map<String, UUID> idsPorNombre, Map<UUID, String> areasPorId) {
        for (CarreraFila carrera : jdbcTemplate.query(
                "SELECT id, nombre, area FROM carreras", CARRERA_ROW_MAPPER)) {
            idsPorNombre.putIfAbsent(normalizar(carrera.nombre()), carrera.id());
            areasPorId.putIfAbsent(carrera.id(), carrera.area());
        }
    }

    private record CarreraFila(UUID id, String nombre, String area) {
    }

    private record CarreraPersistencia(UUID id, String nombre, String area) {
    }

    private record RelacionUniversidadCarrera(UUID universidadId, UUID carreraId) {
    }

    private record UniversidadPersistencia(
            UUID id,
            String nombre,
            String tipo,
            Double latitud,
            Double longitud,
            String direccion,
            String sitioWeb,
            boolean esTecnmIztapalapa1
    ) {
    }
}
