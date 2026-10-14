package com.enudexa.repository;

import com.enudexa.entity.Carrera;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CarreraRepository extends JpaRepository<Carrera, UUID> {
}
