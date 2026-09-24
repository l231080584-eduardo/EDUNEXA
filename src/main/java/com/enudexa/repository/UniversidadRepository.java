package com.enudexa.repository;

import com.enudexa.entity.Universidad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UniversidadRepository extends JpaRepository<Universidad, Long> {

    boolean existsByNombre(String nombre);

    List<Universidad> findByEsTecnmIztapalapa1True();

    List<Universidad> findByNombreContainingIgnoreCase(String nombre);
}
