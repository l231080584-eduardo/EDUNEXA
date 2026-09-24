package com.enudexa.service;

import com.enudexa.dto.MatchResultResponse;
import com.enudexa.dto.TestEvaluationRequest;
import com.enudexa.entity.ResultadoTest;
import com.enudexa.entity.Usuario;
import com.enudexa.repository.ResultadoTestRepository;
import com.enudexa.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EvaluacionService {

    private static final double BONO_IZTAPALAPA_1 = 0.10;

    private final ResultadoTestRepository resultadoTestRepository;
    private final UsuarioRepository usuarioRepository;

    public EvaluacionService(ResultadoTestRepository resultadoTestRepository,
                             UsuarioRepository usuarioRepository) {
        this.resultadoTestRepository = resultadoTestRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public MatchResultResponse evaluar(TestEvaluationRequest request) {
        Usuario usuario = usuarioRepository.findById(request.usuarioId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe el usuario con id " + request.usuarioId()));

        boolean esIztapalapa1 = Boolean.TRUE.equals(request.esTecnmIztapalapa1());
        double score = normalizar(request.intereses()) * 0.35
                + normalizar(request.materias()) * 0.25
                + normalizar(request.estiloVida()) * 0.20
                + normalizar(request.geolocalizacion()) * 0.10
                + (esIztapalapa1 ? BONO_IZTAPALAPA_1 : 0.0);
        ResultadoTest resultado = ResultadoTest.builder()
                .usuario(usuario)
                .vectorRespuestas(request.vectorRespuestas())
                .topCarrerasJson(request.topCarrerasJson())
                .reporteIa(request.reporteIa())
                .puntajeMatch(score)
                .build();

        ResultadoTest guardado = resultadoTestRepository.save(resultado);
        return new MatchResultResponse(guardado.getId(), usuario.getId(), score, esIztapalapa1);
    }

    @Transactional(readOnly = true)
    public List<ResultadoTest> obtenerResultados(UUID usuarioId) {
        return usuarioId == null
                ? resultadoTestRepository.findAll()
                : resultadoTestRepository.findByUsuarioId(usuarioId);
    }

    private double normalizar(Double valor) {
        if (valor == null) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(1.0, valor));
    }
}
