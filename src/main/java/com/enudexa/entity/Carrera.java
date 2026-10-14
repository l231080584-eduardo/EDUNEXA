package com.enudexa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "carreras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Carrera {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 500)
    private String nombre;

    @Column(nullable = false)
    private String area;

    private Integer duracionSemestres;

    @Column(length = 4000)
    private String descripcion;

    private Double pesoIntereses;
    private Double pesoMaterias;
    private Double pesoEstiloVida;
    private Double pesoGeolocalizacion;

    @OneToOne(mappedBy = "carrera", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnore
    private PerfilEgreso perfilEgreso;

    @OneToMany(mappedBy = "carrera", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnore
    private List<CampoLaboral> campoLaboral;

    @ManyToMany(mappedBy = "carreras", fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private Set<Universidad> universidades = new HashSet<>();
}
