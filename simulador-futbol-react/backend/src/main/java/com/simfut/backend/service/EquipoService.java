package com.simfut.backend.service;

import com.simfut.backend.model.Equipo;
import com.simfut.backend.repository.EquipoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EquipoService {

    private final EquipoRepository equipoRepository;

    public EquipoService(EquipoRepository equipoRepository) {
        this.equipoRepository = equipoRepository;
    }

    public List<Equipo> findAll() {
        return equipoRepository.findAll();
    }

    public Equipo findById(Long id) {
        return equipoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado"));
    }

    public Equipo create(Equipo equipo) {
        return equipoRepository.save(equipo);
    }

    public Equipo update(Long id, Equipo equipo) {
        Equipo existing = findById(id);
        existing.setNombre(equipo.getNombre());
        existing.setCiudad(equipo.getCiudad());
        return equipoRepository.save(existing);
    }

    public void delete(Long id) {
        Equipo existing = findById(id);
        equipoRepository.delete(existing);
    }
}
