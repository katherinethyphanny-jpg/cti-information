package br.com.datapulse.ctiinsights.dto;

import br.com.datapulse.ctiinsights.model.Perfil;

// Devolve os dados do usuário sem expor a senha nem o hash
public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        Perfil perfil
) {}
