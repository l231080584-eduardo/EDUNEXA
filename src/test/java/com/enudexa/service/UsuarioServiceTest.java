package com.enudexa.service;

import com.enudexa.dto.UsuarioLoginRequest;
import com.enudexa.dto.UsuarioRegistroRequest;
import com.enudexa.dto.UsuarioResponse;
import com.enudexa.entity.Usuario;
import com.enudexa.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    private BCryptPasswordEncoder passwordEncoder;
    private UsuarioService usuarioService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        usuarioService = new UsuarioService(usuarioRepository, passwordEncoder);
    }

    @Test
    void registrarGuardaPasswordCifradaYRetornaUuid() {
        UUID id = UUID.randomUUID();
        LocalDateTime fechaRegistro = LocalDateTime.now();
        when(usuarioRepository.existsByEmail("estudiante@example.com")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario usuario = invocation.getArgument(0);
            usuario.setId(id);
            usuario.setFechaRegistro(fechaRegistro);
            return usuario;
        });

        UsuarioResponse response = usuarioService.registrar(
                new UsuarioRegistroRequest(" Estudiante ", "Estudiante@Example.com", "password-seguro")
        );

        assertEquals(id, response.id());
        assertEquals("Estudiante", response.nombre());
        assertEquals("estudiante@example.com", response.email());
        assertEquals(fechaRegistro, response.fechaRegistro());
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario saved = captor.getValue();
        assertTrue(passwordEncoder.matches("password-seguro", saved.getPasswordHash()));
        assertFalse(saved.getPasswordHash().contains("password-seguro"));
    }

    @Test
    void rechazaEmailDuplicadoConBadRequest() {
        when(usuarioRepository.existsByEmail("estudiante@example.com")).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> usuarioService.registrar(
                        new UsuarioRegistroRequest("Estudiante", "Estudiante@example.com", "password-seguro")
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void loginValidaPasswordYNoExponeHash() {
        UUID id = UUID.randomUUID();
        String hash = passwordEncoder.encode("password-seguro");
        when(usuarioRepository.findByEmail("estudiante@example.com")).thenReturn(Optional.of(
                Usuario.builder()
                        .id(id)
                        .nombre("Estudiante")
                        .email("estudiante@example.com")
                        .passwordHash(hash)
                        .fechaRegistro(LocalDateTime.now())
                        .build()
        ));

        UsuarioResponse response = usuarioService.login(
                new UsuarioLoginRequest("Estudiante@Example.com", "password-seguro")
        );

        assertEquals(id, response.id());
        assertEquals("estudiante@example.com", response.email());
        assertFalse(response.toString().contains(hash));
    }

    @Test
    void loginRechazaCredencialesInvalidasConUnauthorized() {
        when(usuarioRepository.findByEmail("estudiante@example.com")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> usuarioService.login(new UsuarioLoginRequest("estudiante@example.com", "password-seguro"))
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
    }

    @Test
    void obtenerPorIdRechazaUsuarioInexistenteConNotFound() {
        UUID id = UUID.randomUUID();
        when(usuarioRepository.findById(id)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> usuarioService.obtenerPorId(id)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void registroRechazaPasswordsQueSuperanElLimiteDeBcrypt() {
        when(usuarioRepository.existsByEmail("estudiante@example.com")).thenReturn(false);
        String password = "á".repeat(37);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> usuarioService.registrar(
                        new UsuarioRegistroRequest("Estudiante", "estudiante@example.com", password)
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertTrue(exception.getReason().contains("72 bytes"));
        verify(usuarioRepository, never()).save(any());
    }
}
