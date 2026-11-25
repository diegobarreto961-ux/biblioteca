package br.com.codexa.biblioteca.dto;

import java.time.LocalDate;
import java.util.List;

public record RelatorioEmprestimosResponse(
        LocalDate inicio,
        LocalDate fim,
        long totalEmprestimos,
        long ativos,
        long devolvidos,
        long comAtraso,
        List<Linha> emprestimos
) {
    public record Linha(
            Integer id,
            String cliente,
            String livro,
            String status,
            LocalDate dataRetirada,
            LocalDate dataDevolucaoPrevista,
            LocalDate dataDevolucaoReal,
            long diasAtraso
    ) {}
}