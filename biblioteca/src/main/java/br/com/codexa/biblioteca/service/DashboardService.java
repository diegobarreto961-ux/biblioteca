package br.com.codexa.biblioteca.service;

import br.com.codexa.biblioteca.dto.DashboardResponse;
import br.com.codexa.biblioteca.model.StatusEmprestimo;
import br.com.codexa.biblioteca.model.StatusReserva;
import br.com.codexa.biblioteca.repository.RelatorioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int TOP_LIVROS = 5;

    private final RelatorioRepository relatorioRepository;

    @Transactional(readOnly = true)
    public DashboardResponse gerar() {
        LocalDate hoje = LocalDate.now();
        long totalExemplares = relatorioRepository.somarExemplaresTotais();
        long disponiveis = relatorioRepository.somarExemplaresDisponiveis();

        var maisEmprestados = relatorioRepository
                .livrosMaisEmprestados(PageRequest.of(0, TOP_LIVROS))
                .stream()
                .map(p -> new DashboardResponse.LivroPopular(
                        p.getLivroId(), p.getTitulo(), p.getAutor(), p.getQuantidade()))
                .toList();

        var porGenero = relatorioRepository.emprestimosPorGenero()
                .stream()
                .map(g -> new DashboardResponse.GeneroTotal(g.getGenero(), g.getQuantidade()))
                .toList();

        return new DashboardResponse(
                hoje,
                relatorioRepository.contarTitulos(),
                totalExemplares,
                disponiveis,
                totalExemplares - disponiveis,
                relatorioRepository.contarClientes(),
                relatorioRepository.contarEmprestimosPorStatus(StatusEmprestimo.ATIVO),
                relatorioRepository.contarAtrasados(StatusEmprestimo.ATIVO, hoje),
                relatorioRepository.contarEmprestimosPorStatus(StatusEmprestimo.DEVOLVIDO),
                relatorioRepository.contarReservasPorStatus(StatusReserva.ATIVA),
                maisEmprestados,
                porGenero);
    }
}