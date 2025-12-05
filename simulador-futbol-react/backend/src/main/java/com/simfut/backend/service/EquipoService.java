package com.simfut.backend.service;

import com.simfut.backend.auth.Role;
import com.simfut.backend.model.Equipo;
import com.simfut.backend.repository.EquipoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EquipoService {

    private final EquipoRepository equipoRepository;
    private final AuthorizationService authorizationService;

    public EquipoService(EquipoRepository equipoRepository, AuthorizationService authorizationService) {
        this.equipoRepository = equipoRepository;
        this.authorizationService = authorizationService;
    }

    public List<Equipo> findAll() {
        authorizationService.requireAnyRole(Role.USER, Role.ADMIN);
        return equipoRepository.findAll();
    }

    public Equipo findById(Long id) {
        authorizationService.requireAnyRole(Role.USER, Role.ADMIN);
        return equipoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado"));
    }

    public Equipo create(Equipo equipo) {
        authorizationService.requireAnyRole(Role.ADMIN);
        return equipoRepository.save(equipo);
    }

    public Equipo update(Long id, Equipo equipo) {
        authorizationService.requireAnyRole(Role.ADMIN);
        Equipo existing = findById(id);
        existing.setNombre(equipo.getNombre());
        existing.setCiudad(equipo.getCiudad());
        return equipoRepository.save(existing);
    }

    public void delete(Long id) {
        authorizationService.requireAnyRole(Role.ADMIN);
        Equipo existing = findById(id);
        equipoRepository.delete(existing);
    }
}
