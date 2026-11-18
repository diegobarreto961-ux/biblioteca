package br.com.codexa.biblioteca.service;

import br.com.codexa.biblioteca.dto.LivroRequest;
import br.com.codexa.biblioteca.dto.LivroResponse;
import br.com.codexa.biblioteca.exception.RegraNegocioException;
import br.com.codexa.biblioteca.model.Livro;
import br.com.codexa.biblioteca.repository.LivroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LivroService {

    private final LivroRepository livroRepository;

    @Transactional(readOnly = true)
    public List<LivroResponse> pesquisar(String genero, String busca) {
        return livroRepository.pesquisar(texto(genero), texto(busca))
                .stream()
                .map(LivroResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public LivroResponse buscarPorId(Integer id) {
        return LivroResponse.de(obter(id));
    }

    @Transactional
    public LivroResponse criar(LivroRequest request) {
        String isbn = request.isbn().trim();
        if (livroRepository.findByIsbn(isbn).isPresent()) {
            throw new RegraNegocioException("Já existe um livro com este ISBN", HttpStatus.CONFLICT);
        }

        Livro livro = new Livro();
        preencher(livro, request);
        livro.setQuantidadeDisponivel(request.quantidadeTotal());
        return LivroResponse.de(livroRepository.save(livro));
    }

    @Transactional
    public LivroResponse atualizar(Integer id, LivroRequest request) {
        Livro livro = obter(id);
        String isbn = request.isbn().trim();

        livroRepository.findByIsbn(isbn)
                .filter(outro -> !outro.getId().equals(id))
                .ifPresent(outro -> {
                    throw new RegraNegocioException("Já existe um livro com este ISBN", HttpStatus.CONFLICT);
                });

        int emprestados = livro.getQuantidadeTotal() - livro.getQuantidadeDisponivel();
        if (request.quantidadeTotal() < emprestados) {
            throw new RegraNegocioException(
                    "A quantidade total não pode ser menor que a de exemplares emprestados (" + emprestados + ")",
                    HttpStatus.BAD_REQUEST);
        }

        preencher(livro, request);
        livro.setQuantidadeDisponivel(request.quantidadeTotal() - emprestados);
        return LivroResponse.de(livro);
    }

    @Transactional
    public void excluir(Integer id) {
        Livro livro = obter(id);
        livroRepository.delete(livro);
        livroRepository.flush();
    }

    private Livro obter(Integer id) {
        return livroRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Livro não encontrado", HttpStatus.NOT_FOUND));
    }

    private void preencher(Livro livro, LivroRequest request) {
        livro.setIsbn(request.isbn().trim());
        livro.setTitulo(request.titulo().trim());
        livro.setAutor(request.autor().trim());
        livro.setGenero(request.genero().trim());
        livro.setQuantidadeTotal(request.quantidadeTotal());
    }

    private String texto(String valor) {
        return valor == null ? "" : valor.trim();
    }
}