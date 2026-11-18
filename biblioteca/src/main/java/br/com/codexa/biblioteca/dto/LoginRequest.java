package br.com.codexa.biblioteca.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Informe o e-mail ou telefone") String identificador,
        @NotBlank(message = "A senha é obrigatória") String senha
) {}