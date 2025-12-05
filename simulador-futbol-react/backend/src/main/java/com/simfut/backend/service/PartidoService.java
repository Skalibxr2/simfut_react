package com.simfut.backend.service;

import com.simfut.backend.auth.Role;
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
    private final AuthorizationService authorizationService;

    public PartidoService(PartidoRepository partidoRepository, EquipoRepository equipoRepository, AuthorizationService authorizationService) {
        this.partidoRepository = partidoRepository;
        this.equipoRepository = equipoRepository;
        this.authorizationService = authorizationService;
    }

    public List<Partido> findAll() {
        authorizationService.requireAnyRole(Role.USER, Role.ADMIN);
        return partidoRepository.findAll();
    }

    public Partido findById(Long id) {
        authorizationService.requireAnyRole(Role.USER, Role.ADMIN);
        return partidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partido no encontrado"));
    }

    public Partido create(Partido partido) {
        authorizationService.requireAnyRole(Role.ADMIN);
        partido.setEquipoLocal(resolveEquipo(partido.getEquipoLocal()));
        partido.setEquipoVisitante(resolveEquipo(partido.getEquipoVisitante()));
        return partidoRepository.save(partido);
    }

    public Partido update(Long id, Partido partido) {
        authorizationService.requireAnyRole(Role.ADMIN);
        Partido existing = findById(id);
        existing.setFecha(partido.getFecha());
        existing.setEquipoLocal(resolveEquipo(partido.getEquipoLocal()));
        existing.setEquipoVisitante(resolveEquipo(partido.getEquipoVisitante()));
        existing.setGolesLocal(partido.getGolesLocal());
        existing.setGolesVisitante(partido.getGolesVisitante());
        return partidoRepository.save(existing);
    }

    public void delete(Long id) {
        authorizationService.requireAnyRole(Role.ADMIN);
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
