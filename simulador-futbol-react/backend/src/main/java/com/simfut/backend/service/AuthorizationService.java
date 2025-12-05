package com.simfut.backend.service;

import com.simfut.backend.auth.Role;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AuthorizationService {

    public void requireAnyRole(Role... roles) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("No autenticado");
        }

        Set<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        boolean allowed = Arrays.stream(roles)
                .map(role -> "ROLE_" + role.name())
                .anyMatch(authorities::contains);

        if (!allowed) {
            throw new AccessDeniedException("No tiene permisos para realizar esta operación");
        }
    }
}
