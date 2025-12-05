package com.simfut.backend.service;

import com.simfut.backend.auth.Role;
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

    public List<Jugador> findAll() {
        authorizationService.requireAnyRole(Role.USER, Role.ADMIN);
        return jugadorRepository.findAll();
    }

    public Jugador findById(Long id) {
        authorizationService.requireAnyRole(Role.USER, Role.ADMIN);
        return jugadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no encontrado"));
    }

    public Jugador create(Jugador jugador) {
        authorizationService.requireAnyRole(Role.ADMIN);
        jugador.setEquipo(resolveEquipo(jugador.getEquipo()));
        return jugadorRepository.save(jugador);
    }

    public Jugador update(Long id, Jugador jugador) {
        authorizationService.requireAnyRole(Role.ADMIN);
        Jugador existing = findById(id);
        existing.setNombre(jugador.getNombre());
        existing.setPosicion(jugador.getPosicion());
        existing.setNumeroCamiseta(jugador.getNumeroCamiseta());
        existing.setEquipo(resolveEquipo(jugador.getEquipo()));
        return jugadorRepository.save(existing);
    }

    public void delete(Long id) {
        authorizationService.requireAnyRole(Role.ADMIN);
        Jugador existing = findById(id);
        jugadorRepository.delete(existing);
    }

    private Equipo resolveEquipo(Equipo equipo) {
        if (equipo == null || equipo.getId() == null) {
            return null;
        }
        return equipoRepository.findById(equipo.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipo asociado no encontrado"));
    }
}
