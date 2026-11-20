package br.com.codexa.biblioteca.service;

import br.com.codexa.biblioteca.repository.EmprestimoRepository;
import br.com.codexa.biblioteca.repository.LivroRepository;
import br.com.codexa.biblioteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmprestimoService {

    private final EmprestimoRepository emprestimoRepository;
    private final LivroRepository livroRepository;
    private final UsuarioRepository usuarioRepository;

}
