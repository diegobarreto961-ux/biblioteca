package br.com.codexa.biblioteca.controller;

import br.com.codexa.biblioteca.dto.LivroResponse;
import br.com.codexa.biblioteca.service.LivroService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/livros")
@RequiredArgsConstructor
public class LivroController {

    private final LivroService livroService;

    @GetMapping
    public List<LivroResponse> listar(@RequestParam(required = false) String genero,
                                      @RequestParam(required = false) String busca) {
        return livroService.pesquisar(genero, busca);
    }

    @GetMapping("/{id}")
    public LivroResponse buscar(@PathVariable Integer id) {
        return livroService.buscarPorId(id);
    }
}