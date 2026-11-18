package br.com.codexa.biblioteca.dto;

import br.com.codexa.biblioteca.model.Livro;

public record LivroResponse(Integer id, String isbn, String titulo, String autor, String genero,
                            Integer quantidadeTotal, Integer quantidadeDisponivel, boolean disponivel) {

    public static LivroResponse de(Livro livro) {
        return new LivroResponse(
                livro.getId(),
                livro.getIsbn(),
                livro.getTitulo(),
                livro.getAutor(),
                livro.getGenero(),
                livro.getQuantidadeTotal(),
                livro.getQuantidadeDisponivel(),
                livro.getQuantidadeDisponivel() > 0);
    }
}