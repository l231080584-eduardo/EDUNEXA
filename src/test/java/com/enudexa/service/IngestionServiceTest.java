package com.enudexa.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ParameterizedPreparedStatementSetter;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.ResultSet;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IngestionServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    @SuppressWarnings("unchecked")
    void insertaCarrerasUniversidadesYRelacionesEnLotesSinSelectsPorRegistro() throws Exception {
        UUID universidadId = UUID.randomUUID();
        UUID carreraId = UUID.randomUUID();
        AtomicInteger consultasCarreras = new AtomicInteger();
        AtomicInteger consultasUniversidades = new AtomicInteger();
        doAnswer(invocation -> {
            if (consultasCarreras.incrementAndGet() == 1) {
                return List.of();
            }
            ResultSet resultSet = mock(ResultSet.class);
            when(resultSet.getString("id")).thenReturn(carreraId.toString());
            when(resultSet.getString("nombre")).thenReturn("Ingeniería de Prueba");
            when(resultSet.getString("area")).thenReturn("Ingeniería");
            RowMapper<?> rowMapper = invocation.getArgument(1);
            return List.of(rowMapper.mapRow(resultSet, 0));
        })
                .when(jdbcTemplate).query(eq("SELECT id, nombre, area FROM carreras"), any(RowMapper.class));
        doAnswer(invocation -> {
            RowCallbackHandler callback = invocation.getArgument(1);
            if (consultasUniversidades.incrementAndGet() == 2) {
                ResultSet resultSet = mock(ResultSet.class);
                when(resultSet.getString("id")).thenReturn(universidadId.toString());
                when(resultSet.getString("nombre")).thenReturn("Instituto Tecnológico de Prueba");
                callback.processRow(resultSet);
            }
            return null;
        }).when(jdbcTemplate).query(anyString(), any(RowCallbackHandler.class));

        UniversidadIngestionDto universidad = new UniversidadIngestionDto(
                "Instituto Tecnológico de Prueba", "Tecnológico", 19.4, -99.1,
                "https://example.edu", false,
                List.of(new CarreraIngestionDto("Ingeniería de Prueba", "Ingeniería")));
        IngestionService service = new IngestionService(jdbcTemplate);

        service.procesarIngestion(List.of(universidad, universidad));

        org.mockito.ArgumentCaptor<String> sqlCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, times(3)).batchUpdate(
                sqlCaptor.capture(),
                anyCollection(), eq(1000), any(ParameterizedPreparedStatementSetter.class));
        List<String> batchSql = sqlCaptor.getAllValues();
        assertEquals(3, batchSql.size());
        assertTrue(batchSql.stream().allMatch(sql -> sql.contains("WHERE NOT EXISTS")));
        assertTrue(batchSql.stream().anyMatch(sql -> sql.contains("universidad_carrera")));
        verify(jdbcTemplate, never()).queryForList(anyString(), eq(String.class));
    }

    @Test
    void noConsultaLaBaseSiLaEntradaEstaVacia() {
        IngestionService service = new IngestionService(jdbcTemplate);

        service.procesarIngestion(List.of());

        verify(jdbcTemplate, never()).query(anyString(), any(RowMapper.class));
        verify(jdbcTemplate, never()).batchUpdate(anyString(), anyCollection(), eq(1000),
                any(ParameterizedPreparedStatementSetter.class));
    }
}
