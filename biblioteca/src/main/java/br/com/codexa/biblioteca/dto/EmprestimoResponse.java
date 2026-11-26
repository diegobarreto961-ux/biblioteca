package br.com.codexa.biblioteca.dto;

import br.com.codexa.biblioteca.model.Emprestimo;
import br.com.codexa.biblioteca.model.StatusEmprestimo;

import java.time.LocalDate;

public record EmprestimoResponse(
        Integer id,
        Integer idCliente,
        String nomeCliente,
        Integer idLivro,
        String tituloLivro,
        Integer idAdministrador,
        StatusEmprestimo status,
        LocalDate dataRetirada,
        LocalDate dataDevolucaoPrevista,
        LocalDate dataDevolucaoReal
) {
    public static EmprestimoResponse de(Emprestimo emprestimo) {
        return new EmprestimoResponse(
                emprestimo.getId(),
                emprestimo.getCliente().getId(),
                emprestimo.getCliente().getNome(),
                emprestimo.getLivro().getId(),
                emprestimo.getLivro().getTitulo(),
                emprestimo.getAdministrador().getId(),
                emprestimo.getStatus(),
                emprestimo.getDataRetirada(),
                emprestimo.getDataDevolucaoPrevista(),
                emprestimo.getDataDevolucaoReal()
        );
    }
}
