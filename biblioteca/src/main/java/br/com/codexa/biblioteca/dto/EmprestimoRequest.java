package br.com.codexa.biblioteca.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EmprestimoRequest(

        @NotNull(message = "O cliente é obrigatório")
        Integer idCliente,

        @NotNull(message = "O livro é obrigatório")
        Integer idLivro,

        @NotNull(message = "A data de devolução é obrigatória")
        @Future(message = "A data de devolução deve ser futura")
        LocalDate dataDevolucaoPrevista

) {}
