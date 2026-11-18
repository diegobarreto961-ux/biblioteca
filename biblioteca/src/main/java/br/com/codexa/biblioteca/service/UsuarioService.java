package br.com.codexa.biblioteca.service;

import br.com.codexa.biblioteca.dto.CadastroClienteRequest;
import br.com.codexa.biblioteca.exception.RegraNegocioException;
import br.com.codexa.biblioteca.model.Cliente;
import br.com.codexa.biblioteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Cliente cadastrarCliente(CadastroClienteRequest request) {
        String email = normalizar(request.email());
        String telefone = normalizar(request.telefone());

        if (email == null && telefone == null) {
            throw new RegraNegocioException(
                    "Informe ao menos um e-mail ou um telefone", HttpStatus.BAD_REQUEST);
        }
        if (email != null && usuarioRepository.findByEmail(email).isPresent()) {
            throw new RegraNegocioException("E-mail já cadastrado", HttpStatus.CONFLICT);
        }
        if (telefone != null && usuarioRepository.findByTelefone(telefone).isPresent()) {
            throw new RegraNegocioException("Telefone já cadastrado", HttpStatus.CONFLICT);
        }

        Cliente cliente = new Cliente();
        cliente.setNome(request.nome().trim());
        cliente.setEmail(email);
        cliente.setTelefone(telefone);
        cliente.setSenhaHash(passwordEncoder.encode(request.senha()));
        return usuarioRepository.save(cliente);
    }

    private String normalizar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}