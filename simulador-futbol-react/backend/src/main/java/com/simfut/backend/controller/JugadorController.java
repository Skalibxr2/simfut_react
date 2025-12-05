package com.simfut.backend.controller;

import com.simfut.backend.model.Jugador;
import com.simfut.backend.service.JugadorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/jugadores")
@Tag(name = "Jugadores", description = "Gestión de jugadores")
public class JugadorController {

    private final JugadorService jugadorService;

    public JugadorController(JugadorService jugadorService) {
        this.jugadorService = jugadorService;
    }

    @GetMapping
    @Operation(summary = "Listar jugadores")
    public List<Jugador> findAll() {
        return jugadorService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener jugador por id")
    public Jugador findById(@PathVariable Long id) {
        return jugadorService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear jugador")
    @PreAuthorize("hasRole('ADMIN')")
    public Jugador create(@Valid @RequestBody Jugador jugador) {
        return jugadorService.create(jugador);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar jugador")
    @PreAuthorize("hasRole('ADMIN')")
    public Jugador update(@PathVariable Long id, @Valid @RequestBody Jugador jugador) {
        return jugadorService.update(id, jugador);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar jugador")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        jugadorService.delete(id);
    }
}
