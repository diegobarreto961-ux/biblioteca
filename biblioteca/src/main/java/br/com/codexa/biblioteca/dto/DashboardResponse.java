package br.com.codexa.biblioteca.dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(
        LocalDate geradoEm,
        long totalTitulos,
        long totalExemplares,
        long exemplaresDisponiveis,
        long exemplaresEmprestados,
        long totalClientes,
        long emprestimosAtivos,
        long emprestimosAtrasados,
        long emprestimosDevolvidos,
        long reservasAtivas,
        List<LivroPopular> livrosMaisEmprestados,
        List<GeneroTotal> emprestimosPorGenero
) {
    public record LivroPopular(Integer livroId, String titulo, String autor, long quantidade) {}

    public record GeneroTotal(String genero, long quantidade) {}
}