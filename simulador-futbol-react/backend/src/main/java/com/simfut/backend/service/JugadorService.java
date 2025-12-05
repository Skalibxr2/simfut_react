package com.simfut.backend.service;

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

    public JugadorService(JugadorRepository jugadorRepository, EquipoRepository equipoRepository) {
        this.jugadorRepository = jugadorRepository;
        this.equipoRepository = equipoRepository;
    }

    public List<Jugador> findAll() {
        return jugadorRepository.findAll();
    }

    public Jugador findById(Long id) {
        return jugadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no encontrado"));
    }

    public Jugador create(Jugador jugador) {
        jugador.setEquipo(resolveEquipo(jugador.getEquipo()));
        return jugadorRepository.save(jugador);
    }

    public Jugador update(Long id, Jugador jugador) {
        Jugador existing = findById(id);
        existing.setNombre(jugador.getNombre());
        existing.setPosicion(jugador.getPosicion());
        existing.setNumeroCamiseta(jugador.getNumeroCamiseta());
        existing.setEquipo(resolveEquipo(jugador.getEquipo()));
        return jugadorRepository.save(existing);
    }

    public void delete(Long id) {
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
