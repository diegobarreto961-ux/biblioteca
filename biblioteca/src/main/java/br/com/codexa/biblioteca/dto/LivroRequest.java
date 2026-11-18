package br.com.codexa.biblioteca.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LivroRequest(
        @NotBlank(message = "O ISBN é obrigatório")
        @Size(max = 17, message = "O ISBN deve ter no máximo 17 caracteres")
        String isbn,

        @NotBlank(message = "O título é obrigatório")
        @Size(max = 200, message = "O título deve ter no máximo 200 caracteres")
        String titulo,

        @NotBlank(message = "O autor é obrigatório")
        @Size(max = 150, message = "O autor deve ter no máximo 150 caracteres")
        String autor,

        @NotBlank(message = "O gênero é obrigatório")
        @Size(max = 80, message = "O gênero deve ter no máximo 80 caracteres")
        String genero,

        @NotNull(message = "A quantidade total é obrigatória")
        @Min(value = 0, message = "A quantidade total não pode ser negativa")
        Integer quantidadeTotal
) {}