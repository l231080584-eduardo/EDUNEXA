package com.enudexa.repository;

import com.enudexa.entity.ResultadoTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResultadoTestRepository extends JpaRepository<ResultadoTest, UUID> {

    List<ResultadoTest> findByUsuarioId(UUID usuarioId);
}
