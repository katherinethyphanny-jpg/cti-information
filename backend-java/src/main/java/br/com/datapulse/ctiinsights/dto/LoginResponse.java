package br.com.datapulse.ctiinsights.dto;

import br.com.datapulse.ctiinsights.model.Perfil;

public record LoginResponse(
        String token,
        String tipo,
        String email,
        String nome,
        Perfil perfil
) {}
