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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/emprestimos")
@RequiredArgsConstructor
public class EmprestimoController {

    private final EmprestimoService emprestimoService;

    @PostMapping
    public ResponseEntity<EmprestimoResponse> registrar(
            @Valid @RequestBody EmprestimoRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Integer idAdministrador = Integer.valueOf(jwt.getSubject());

        EmprestimoResponse response = emprestimoService.registrar(
                request, idAdministrador);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/devolucao")
    public ResponseEntity<EmprestimoResponse> devolver(
            @PathVariable Integer id) {

        EmprestimoResponse response = emprestimoService.devolver(id);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<EmprestimoResponse>> listarTodos() {
        return ResponseEntity.ok(emprestimoService.listarTodos());
    }

    @GetMapping("/cliente/{idCliente}")
    public ResponseEntity<List<EmprestimoResponse>> listarPorCliente(
            @PathVariable Integer idCliente) {

        return ResponseEntity.ok(
                emprestimoService.listarPorCliente(idCliente));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmprestimoResponse> buscarPorId(
            @PathVariable Integer id) {

        return ResponseEntity.ok(emprestimoService.buscarPorId(id));
    }
}
