package br.com.codexa.biblioteca.controller;

import br.com.codexa.biblioteca.dto.EmprestimoRequest;
import br.com.codexa.biblioteca.dto.EmprestimoResponse;
import br.com.codexa.biblioteca.service.EmprestimoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/emprestimos")
@RequiredArgsConstructor
public class EmprestimoController {

    private final EmprestimoService emprestimoService;

    // Registrar empréstimo
    @PostMapping
    public ResponseEntity<EmprestimoResponse> registrar(
            @Valid @RequestBody EmprestimoRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Integer idAdministrador = Integer.valueOf(jwt.getSubject());

        EmprestimoResponse response = emprestimoService.registrar(
                request, idAdministrador);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Devolver livro
    @PutMapping("/{id}/devolucao")
    public ResponseEntity<EmprestimoResponse> devolver(
            @PathVariable Integer id) {

        EmprestimoResponse response = emprestimoService.devolver(id);

        return ResponseEntity.ok(response);
    }

    // Listar todos os empréstimos
    @GetMapping
    public ResponseEntity<List<EmprestimoResponse>> listarTodos() {
        return ResponseEntity.ok(emprestimoService.listarTodos());
    }

    // Listar empréstimos por cliente
    @GetMapping("/cliente/{idCliente}")
    public ResponseEntity<List<EmprestimoResponse>> listarPorCliente(
            @PathVariable Integer idCliente) {

        return ResponseEntity.ok(
                emprestimoService.listarPorCliente(idCliente));
    }

    // Buscar empréstimo por ID
    @GetMapping("/{id}")
    public ResponseEntity<EmprestimoResponse> buscarPorId(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                emprestimoService.buscarPorId(id));
    }
}
