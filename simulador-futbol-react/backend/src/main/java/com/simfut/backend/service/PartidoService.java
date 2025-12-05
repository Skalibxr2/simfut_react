package com.simfut.backend.service;

import com.simfut.backend.model.Equipo;
import com.simfut.backend.model.Partido;
import com.simfut.backend.repository.EquipoRepository;
import com.simfut.backend.repository.PartidoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PartidoService {

    private final PartidoRepository partidoRepository;
    private final EquipoRepository equipoRepository;

    public PartidoService(PartidoRepository partidoRepository, EquipoRepository equipoRepository) {
        this.partidoRepository = partidoRepository;
        this.equipoRepository = equipoRepository;
    }

    public List<Partido> findAll() {
        return partidoRepository.findAll();
    }

    public Partido findById(Long id) {
        return partidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partido no encontrado"));
    }

    public Partido create(Partido partido) {
        partido.setEquipoLocal(resolveEquipo(partido.getEquipoLocal()));
        partido.setEquipoVisitante(resolveEquipo(partido.getEquipoVisitante()));
        return partidoRepository.save(partido);
    }

    public Partido update(Long id, Partido partido) {
        Partido existing = findById(id);
        existing.setFecha(partido.getFecha());
        existing.setEquipoLocal(resolveEquipo(partido.getEquipoLocal()));
        existing.setEquipoVisitante(resolveEquipo(partido.getEquipoVisitante()));
        existing.setGolesLocal(partido.getGolesLocal());
        existing.setGolesVisitante(partido.getGolesVisitante());
        return partidoRepository.save(existing);
    }

    public void delete(Long id) {
        Partido existing = findById(id);
        partidoRepository.delete(existing);
    }

    private Equipo resolveEquipo(Equipo equipo) {
        if (equipo == null || equipo.getId() == null) {
            return null;
        }
        return equipoRepository.findById(equipo.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipo asociado no encontrado"));
    }
}
