package com.simfut.backend.controller;

import com.simfut.backend.model.Partido;
import com.simfut.backend.service.PartidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/partidos")
@Tag(name = "Partidos", description = "Gestión de partidos")
public class PartidoController {

    private final PartidoService partidoService;

    public PartidoController(PartidoService partidoService) {
        this.partidoService = partidoService;
    }

    @GetMapping
    @Operation(summary = "Listar partidos")
    public List<Partido> findAll() {
        return partidoService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener partido por id")
    public Partido findById(@PathVariable Long id) {
        return partidoService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear partido")
    public Partido create(@Valid @RequestBody Partido partido) {
        return partidoService.create(partido);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar partido")
    public Partido update(@PathVariable Long id, @Valid @RequestBody Partido partido) {
        return partidoService.update(id, partido);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar partido")
    public void delete(@PathVariable Long id) {
        partidoService.delete(id);
    }
}
