package com.enudexa.repository;

import com.enudexa.entity.Universidad;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface UniversidadRepository extends JpaRepository<Universidad, UUID> {

    @EntityGraph(attributePaths = {"carreras"})
    @Query("select distinct universidad from Universidad universidad")
    List<Universidad> findAllWithCarreras();

    boolean existsByNombre(String nombre);

    List<Universidad> findByEsTecnmIztapalapa1True();

    List<Universidad> findByNombreContainingIgnoreCase(String nombre);
}
