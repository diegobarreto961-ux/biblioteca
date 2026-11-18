package br.com.codexa.biblioteca.controller;

import br.com.codexa.biblioteca.dto.CadastroClienteRequest;
import br.com.codexa.biblioteca.dto.ClienteResponse;
import br.com.codexa.biblioteca.dto.LoginRequest;
import br.com.codexa.biblioteca.dto.LoginResponse;
import br.com.codexa.biblioteca.service.AuthService;
import br.com.codexa.biblioteca.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;
    private final AuthService authService;

    @PostMapping("/cadastro")
    public ResponseEntity<ClienteResponse> cadastrar(@Valid @RequestBody CadastroClienteRequest request) {
        var cliente = usuarioService.cadastrarCliente(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ClienteResponse.de(cliente));
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}