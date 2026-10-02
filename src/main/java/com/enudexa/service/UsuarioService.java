package com.enudexa.service;

import com.enudexa.dto.UsuarioLoginRequest;
import com.enudexa.dto.UsuarioRegistroRequest;
import com.enudexa.dto.UsuarioResponse;
import com.enudexa.entity.Usuario;
import com.enudexa.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

@Service
public class UsuarioService {

    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioResponse registrar(UsuarioRegistroRequest request) {
        String email = normalizarEmail(request.email());
        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email ya está registrado");
        }

        validarLongitudPassword(request.password());
        Usuario usuario = Usuario.builder()
                .nombre(request.nombre().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        try {
            return toResponse(usuarioRepository.save(usuario));
        } catch (DataIntegrityViolationException exception) {
            // Also handle concurrent registrations that pass the existence check together.
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email ya está registrado", exception);
        }
    }

    @Transactional(readOnly = true)
    public UsuarioResponse login(UsuarioLoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(normalizarEmail(request.email()))
                .orElseThrow(() -> credencialesInvalidas());

        if (request.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES
                || !passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw credencialesInvalidas();
        }
        return toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorId(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return toResponse(usuario);
    }

    private void validarLongitudPassword(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La contraseña no puede superar los 72 bytes en UTF-8"
            );
        }
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException credencialesInvalidas() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email o contraseña inválidos");
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getFechaRegistro()
        );
    }
}
