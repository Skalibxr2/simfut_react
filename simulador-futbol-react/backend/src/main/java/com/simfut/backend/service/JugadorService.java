package com.simfut.backend.service;

import com.simfut.backend.auth.Role;
import com.simfut.backend.controller.dto.JugadorRequest;
import com.simfut.backend.controller.dto.JugadorResponse;
import com.simfut.backend.model.Equipo;
import com.simfut.backend.model.Jugador;
import com.simfut.backend.repository.EquipoRepository;
import com.simfut.backend.repository.JugadorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JugadorService {

    private final JugadorRepository jugadorRepository;
    private final EquipoRepository equipoRepository;
    private final AuthorizationService authorizationService;

    public JugadorService(JugadorRepository jugadorRepository, EquipoRepository equipoRepository, AuthorizationService authorizationService) {
        this.jugadorRepository = jugadorRepository;
        this.equipoRepository = equipoRepository;
        this.authorizationService = authorizationService;
    }

    public List<JugadorResponse> findAll() {
        authorizationService.requireAnyRole(Role.USER, Role.ADMIN);
        return jugadorRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public JugadorResponse findById(Long id) {
        authorizationService.requireAnyRole(Role.USER, Role.ADMIN);
        Jugador jugador = findEntityById(id);
        return toResponse(jugador);
    }

    public JugadorResponse create(JugadorRequest request) {
        authorizationService.requireAnyRole(Role.ADMIN);
        Jugador jugador = new Jugador();
        applyRequest(jugador, request);
        return toResponse(jugadorRepository.save(jugador));
    }

    public JugadorResponse update(Long id, JugadorRequest request) {
        authorizationService.requireAnyRole(Role.ADMIN);
        Jugador existing = findEntityById(id);
        applyRequest(existing, request);
        return toResponse(jugadorRepository.save(existing));
    }

    public void delete(Long id) {
        authorizationService.requireAnyRole(Role.ADMIN);
        Jugador existing = findEntityById(id);
        jugadorRepository.delete(existing);
    }

    private void applyRequest(Jugador jugador, JugadorRequest request) {
        jugador.setNombre(request.getNombre());
        jugador.setPosicion(request.getPosicion());
        jugador.setNumeroCamiseta(request.getNumeroCamiseta());
        jugador.setEquipo(resolveEquipo(request.getEquipoId()));
    }

    private Jugador findEntityById(Long id) {
        return jugadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no encontrado"));
    }

    private Equipo resolveEquipo(Long equipoId) {
        if (equipoId == null) {
            return null;
        }
        return equipoRepository.findById(equipoId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo asociado no encontrado"));
    }

    private JugadorResponse toResponse(Jugador jugador) {
        Long equipoId = jugador.getEquipo() != null ? jugador.getEquipo().getId() : null;
        return new JugadorResponse(
                jugador.getId(),
                jugador.getNombre(),
                jugador.getPosicion(),
                jugador.getNumeroCamiseta(),
                equipoId
        );
    }
}
