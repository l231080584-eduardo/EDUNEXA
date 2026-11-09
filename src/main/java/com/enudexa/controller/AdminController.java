package com.enudexa.controller;

import com.enudexa.dto.AdminEstudianteDTO;
import com.enudexa.entity.ResultadoTest;
import com.enudexa.entity.Usuario;
import com.enudexa.repository.ResultadoTestRepository;
import com.enudexa.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final ResultadoTestRepository resultadoTestRepository;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    public AdminController(UsuarioRepository usuarioRepository,
                           ResultadoTestRepository resultadoTestRepository) {
        this.usuarioRepository = usuarioRepository;
        this.resultadoTestRepository = resultadoTestRepository;
    }

    @GetMapping("/estudiantes")
    public ResponseEntity<List<AdminEstudianteDTO>> getEstudiantes(
            @RequestHeader(value = "X-Admin-Password", required = false) String headerPassword) {

        if (adminPassword == null || adminPassword.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Panel no configurado. La variable de entorno ADMIN_PASSWORD no está definida.");
        }

        if (headerPassword == null || !adminPassword.equals(headerPassword)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Contraseña incorrecta");
        }

        List<Usuario> usuarios = usuarioRepository.findAll();
        List<AdminEstudianteDTO> resultado = new ArrayList<>();

        for (Usuario usuario : usuarios) {
            Optional<ResultadoTest> ultimoResultado = resultadoTestRepository
                    .findTopByUsuarioIdOrderByFechaCreacionDesc(usuario.getId());

            AdminEstudianteDTO dto;
            if (ultimoResultado.isPresent()) {
                ResultadoTest rt = ultimoResultado.get();
                dto = new AdminEstudianteDTO(
                        usuario.getNombre(),
                        usuario.getEmail(),
                        usuario.getWhatsapp(),
                        rt.getCarreraSugerida(),
                        rt.getUniversidadRecomendada(),
                        rt.getFechaCreacion(),
                        usuario.getConsentimientoContacto(),
                        usuario.getInteresTecnm()
                );
            } else {
                dto = new AdminEstudianteDTO(
                        usuario.getNombre(),
                        usuario.getEmail(),
                        usuario.getWhatsapp(),
                        null,
                        null,
                        usuario.getFechaRegistro(),
                        usuario.getConsentimientoContacto(),
                        usuario.getInteresTecnm()
                );
            }
            resultado.add(dto);
        }

        // Sort: users with results by fechaCreacion desc, users without results at the end by fechaRegistro desc
        resultado.sort(Comparator.<AdminEstudianteDTO>comparingInt(
                        dto -> dto.carreraRecomendada() != null ? 0 : 1)
                .thenComparing(
                        dto -> dto.fechaCreacion() != null ? dto.fechaCreacion() : java.time.LocalDateTime.MIN,
                        Comparator.reverseOrder()
                ));

        return ResponseEntity.ok(resultado);
    }
}
