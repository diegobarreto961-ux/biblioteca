package br.com.codexa.biblioteca.repository;

import br.com.codexa.biblioteca.model.Livro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LivroRepository extends JpaRepository<Livro, Integer> {

    Optional<Livro> findByIsbn(String isbn);

    List<Livro> findByGeneroIgnoreCase(String genero);

    @Query("""
            SELECT l FROM Livro l
            WHERE (:genero = '' OR LOWER(l.genero) = LOWER(:genero))
              AND (:busca = ''
                   OR LOWER(l.titulo) LIKE LOWER(CONCAT('%', :busca, '%'))
                   OR LOWER(l.autor) LIKE LOWER(CONCAT('%', :busca, '%')))
            ORDER BY l.titulo
            """)
    List<Livro> pesquisar(@Param("genero") String genero, @Param("busca") String busca);
}