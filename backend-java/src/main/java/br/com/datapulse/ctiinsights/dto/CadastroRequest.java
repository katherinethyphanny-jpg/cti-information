package br.com.datapulse.ctiinsights.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadastroRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Email String email,
        // BCrypt só considera os 72 primeiros bytes da senha
        @NotBlank @Size(min = 8, max = 72) String senha
) {}
