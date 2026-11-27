package br.com.codexa.biblioteca.controller;

import br.com.codexa.biblioteca.dto.ClienteResponse;
import br.com.codexa.biblioteca.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/clientes")
@RequiredArgsConstructor
public class ClienteAdminController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<ClienteResponse>> listar() {
        return ResponseEntity.ok(usuarioService.listarClientes());
    }
}