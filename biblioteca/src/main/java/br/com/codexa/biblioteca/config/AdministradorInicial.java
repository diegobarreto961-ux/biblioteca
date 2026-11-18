package br.com.codexa.biblioteca.config;

import br.com.codexa.biblioteca.model.Administrador;
import br.com.codexa.biblioteca.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdministradorInicial implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String nome;
    private final String email;
    private final String senha;

    public AdministradorInicial(UsuarioRepository usuarioRepository,
                                PasswordEncoder passwordEncoder,
                                @Value("${app.admin.nome}") String nome,
                                @Value("${app.admin.email}") String email,
                                @Value("${app.admin.senha}") String senha) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.findByEmail(email).isPresent()) {
            return;
        }
        Administrador admin = new Administrador();
        admin.setNome(nome);
        admin.setEmail(email);
        admin.setSenhaHash(passwordEncoder.encode(senha));
        usuarioRepository.save(admin);
    }
}