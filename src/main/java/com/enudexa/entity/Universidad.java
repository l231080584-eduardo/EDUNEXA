package com.enudexa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "universidades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Universidad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 1000)
    private String nombre;

    private String tipo;
    private Double latitud;
    private Double longitud;

    @Column(length = 1000)
    private String direccion;

    @Column(length = 1000)
    private String sitioWeb;

    @Column(nullable = false)
    private boolean esTecnmIztapalapa1;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "universidad_carrera",
            joinColumns = @JoinColumn(name = "universidad_id"),
            inverseJoinColumns = @JoinColumn(name = "carrera_id")
    )
    @Builder.Default
    @JsonIgnore
    private Set<Carrera> carreras = new HashSet<>();
}
