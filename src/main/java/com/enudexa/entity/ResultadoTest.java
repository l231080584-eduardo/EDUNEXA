package com.enudexa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "resultados_test")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ResultadoTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    @EqualsAndHashCode.Include
    private Long id;

    @Builder.Default
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "puntaje_general")
    private Double puntajeGeneral;

    @Column(name = "carrera_sugerida")
    private String carreraSugerida;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime fechaEvaluacion = LocalDateTime.now();

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String vectorRespuestas;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String topCarrerasJson;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String reporteIa;

    private Double puntajeMatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @ToString.Exclude
    private Usuario usuario;

    @PrePersist
    public void prePersist() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
        if (fechaEvaluacion == null) {
            fechaEvaluacion = LocalDateTime.now();
        }
    }
}
