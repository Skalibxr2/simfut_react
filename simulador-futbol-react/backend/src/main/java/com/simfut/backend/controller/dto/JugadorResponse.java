package com.simfut.backend.controller.dto;

public class JugadorResponse {

    private Long id;
    private String nombre;
    private String posicion;
    private Integer numeroCamiseta;
    private Long equipoId;

    public JugadorResponse() {
    }

    public JugadorResponse(Long id, String nombre, String posicion, Integer numeroCamiseta, Long equipoId) {
        this.id = id;
        this.nombre = nombre;
        this.posicion = posicion;
        this.numeroCamiseta = numeroCamiseta;
        this.equipoId = equipoId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getPosicion() {
        return posicion;
    }

    public void setPosicion(String posicion) {
        this.posicion = posicion;
    }

    public Integer getNumeroCamiseta() {
        return numeroCamiseta;
    }

    public void setNumeroCamiseta(Integer numeroCamiseta) {
        this.numeroCamiseta = numeroCamiseta;
    }

    public Long getEquipoId() {
        return equipoId;
    }

    public void setEquipoId(Long equipoId) {
        this.equipoId = equipoId;
    }
}
