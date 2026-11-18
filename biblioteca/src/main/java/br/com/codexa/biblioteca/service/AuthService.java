package br.com.codexa.biblioteca.service;

import br.com.codexa.biblioteca.dto.LoginRequest;
import br.com.codexa.biblioteca.dto.LoginResponse;
import br.com.codexa.biblioteca.exception.RegraNegocioException;
import br.com.codexa.biblioteca.model.Usuario;
import br.com.codexa.biblioteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public LoginResponse login(LoginRequest request) {
        String identificador = request.identificador().trim();

        Usuario usuario = usuarioRepository.findByEmail(identificador)
                .or(() -> usuarioRepository.findByTelefone(identificador))
                .orElse(null);

        if (usuario == null || !passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new RegraNegocioException("Credenciais inválidas", HttpStatus.UNAUTHORIZED);
        }

        return new LoginResponse(
                tokenService.gerar(usuario),
                "Bearer",
                tokenService.getExpiracaoSegundos(),
                usuario.getPerfil(),
                usuario.getNome());
    }
}