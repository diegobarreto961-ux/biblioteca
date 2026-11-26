package br.com.codexa.biblioteca.controller;

import br.com.codexa.biblioteca.dto.RelatorioEmprestimosResponse;
import br.com.codexa.biblioteca.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService relatorioService;

    @GetMapping("/emprestimos")
    public RelatorioEmprestimosResponse emprestimos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return relatorioService.emprestimosPorPeriodo(inicio, fim);
    }

    @GetMapping("/emprestimos/csv")
    public ResponseEntity<byte[]> emprestimosCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {

        // O "\uFEFF" no início faz o Excel reconhecer os acentos
        byte[] corpo = ("\uFEFF" + relatorioService.emprestimosPorPeriodoCsv(inicio, fim))
                .getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"relatorio-emprestimos.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(corpo);
    }
}