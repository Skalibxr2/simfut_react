package com.simfut.backend.controller;

import com.simfut.backend.model.Equipo;
import com.simfut.backend.service.EquipoService;
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
@RequestMapping("/api/equipos")
@Tag(name = "Equipos", description = "Gestión de equipos")
public class EquipoController {

    private final EquipoService equipoService;

    public EquipoController(EquipoService equipoService) {
        this.equipoService = equipoService;
    }

    @GetMapping
    @Operation(summary = "Listar equipos")
    public List<Equipo> findAll() {
        return equipoService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener equipo por id")
    public Equipo findById(@PathVariable Long id) {
        return equipoService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear equipo")
    @PreAuthorize("hasRole('ADMIN')")
    public Equipo create(@Valid @RequestBody Equipo equipo) {
        return equipoService.create(equipo);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar equipo")
    @PreAuthorize("hasRole('ADMIN')")
    public Equipo update(@PathVariable Long id, @Valid @RequestBody Equipo equipo) {
        return equipoService.update(id, equipo);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar equipo")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        equipoService.delete(id);
    }
}
