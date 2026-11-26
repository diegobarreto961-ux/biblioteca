package br.com.codexa.biblioteca.service;

import br.com.codexa.biblioteca.dto.RelatorioEmprestimosResponse;
import br.com.codexa.biblioteca.dto.RelatorioEmprestimosResponse.Linha;
import br.com.codexa.biblioteca.exception.RegraNegocioException;
import br.com.codexa.biblioteca.model.Emprestimo;
import br.com.codexa.biblioteca.model.StatusEmprestimo;
import br.com.codexa.biblioteca.repository.RelatorioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RelatorioService {

    private static final int PERIODO_PADRAO_DIAS = 30;
    private static final int PERIODO_MAXIMO_DIAS = 366;
    private static final DateTimeFormatter FORMATO_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final RelatorioRepository relatorioRepository;

    @Transactional(readOnly = true)
    public RelatorioEmprestimosResponse emprestimosPorPeriodo(LocalDate inicio, LocalDate fim) {
        LocalDate dataFim = fim != null ? fim : LocalDate.now();
        LocalDate dataInicio = inicio != null ? inicio : dataFim.minusDays(PERIODO_PADRAO_DIAS);

        if (dataInicio.isAfter(dataFim)) {
            throw new RegraNegocioException(
                    "A data inicial não pode ser posterior à data final", HttpStatus.BAD_REQUEST);
        }
        if (ChronoUnit.DAYS.between(dataInicio, dataFim) > PERIODO_MAXIMO_DIAS) {
            throw new RegraNegocioException(
                    "O período máximo do relatório é de " + PERIODO_MAXIMO_DIAS + " dias", HttpStatus.BAD_REQUEST);
        }

        LocalDate hoje = LocalDate.now();
        List<Linha> linhas = relatorioRepository.listarPorPeriodo(dataInicio, dataFim)
                .stream()
                .map(e -> paraLinha(e, hoje))
                .toList();

        return new RelatorioEmprestimosResponse(
                dataInicio,
                dataFim,
                linhas.size(),
                linhas.stream().filter(l -> StatusEmprestimo.ATIVO.name().equals(l.status())).count(),
                linhas.stream().filter(l -> StatusEmprestimo.DEVOLVIDO.name().equals(l.status())).count(),
                linhas.stream().filter(l -> l.diasAtraso() > 0).count(),
                linhas);
    }

    @Transactional(readOnly = true)
    public String emprestimosPorPeriodoCsv(LocalDate inicio, LocalDate fim) {
        RelatorioEmprestimosResponse relatorio = emprestimosPorPeriodo(inicio, fim);

        StringBuilder csv = new StringBuilder();
        csv.append("ID;Cliente;Livro;Status;Data de retirada;Devolução prevista;Devolução real;Dias de atraso\n");
        for (Linha l : relatorio.emprestimos()) {
            csv.append(l.id()).append(';')
               .append(campo(l.cliente())).append(';')
               .append(campo(l.livro())).append(';')
               .append(l.status()).append(';')
               .append(data(l.dataRetirada())).append(';')
               .append(data(l.dataDevolucaoPrevista())).append(';')
               .append(data(l.dataDevolucaoReal())).append(';')
               .append(l.diasAtraso()).append('\n');
        }
        return csv.toString();
    }

    private Linha paraLinha(Emprestimo e, LocalDate hoje) {
        LocalDate referencia = e.getDataDevolucaoReal() != null ? e.getDataDevolucaoReal() : hoje;
        long diasAtraso = Math.max(0, ChronoUnit.DAYS.between(e.getDataDevolucaoPrevista(), referencia));
        return new Linha(
                e.getId(),
                e.getCliente().getNome(),
                e.getLivro().getTitulo(),
                e.getStatus().name(),
                e.getDataRetirada(),
                e.getDataDevolucaoPrevista(),
                e.getDataDevolucaoReal(),
                diasAtraso);
    }

    private String data(LocalDate data) {
        return data == null ? "" : data.format(FORMATO_DATA);
    }

    // Protege o separador ";" e aspas, e evita que o Excel interprete texto como fórmula
    private String campo(String valor) {
        String texto = valor == null ? "" : valor;
        if (!texto.isEmpty() && "=+-@".indexOf(texto.charAt(0)) >= 0) {
            texto = "'" + texto;
        }
        if (texto.contains(";") || texto.contains("\"") || texto.contains("\n") || texto.contains("\r")) {
            texto = "\"" + texto.replace("\"", "\"\"") + "\"";
        }
        return texto;
    }
}