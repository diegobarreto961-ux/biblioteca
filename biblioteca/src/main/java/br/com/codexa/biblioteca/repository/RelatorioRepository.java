package br.com.codexa.biblioteca.repository;

import br.com.codexa.biblioteca.model.Emprestimo;
import br.com.codexa.biblioteca.model.StatusEmprestimo;
import br.com.codexa.biblioteca.model.StatusReserva;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RelatorioRepository extends Repository<Emprestimo, Integer> {

    interface LivroPopularProjecao {
        Integer getLivroId();
        String getTitulo();
        String getAutor();
        Long getQuantidade();
    }

    interface GeneroTotalProjecao {
        String getGenero();
        Long getQuantidade();
    }

    @Query("SELECT COUNT(l) FROM Livro l")
    long contarTitulos();

    @Query("SELECT COALESCE(SUM(l.quantidadeTotal), 0) FROM Livro l")
    long somarExemplaresTotais();

    @Query("SELECT COALESCE(SUM(l.quantidadeDisponivel), 0) FROM Livro l")
    long somarExemplaresDisponiveis();

    @Query("SELECT COUNT(c) FROM Cliente c")
    long contarClientes();

    @Query("SELECT COUNT(e) FROM Emprestimo e WHERE e.status = :status")
    long contarEmprestimosPorStatus(@Param("status") StatusEmprestimo status);

    @Query("SELECT COUNT(e) FROM Emprestimo e WHERE e.status = :status AND e.dataDevolucaoPrevista < :hoje")
    long contarAtrasados(@Param("status") StatusEmprestimo status, @Param("hoje") LocalDate hoje);

    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.status = :status")
    long contarReservasPorStatus(@Param("status") StatusReserva status);

    @Query("""
            SELECT e.livro.id AS livroId, e.livro.titulo AS titulo,
                   e.livro.autor AS autor, COUNT(e) AS quantidade
            FROM Emprestimo e
            GROUP BY e.livro.id, e.livro.titulo, e.livro.autor
            ORDER BY COUNT(e) DESC, e.livro.titulo ASC
            """)
    List<LivroPopularProjecao> livrosMaisEmprestados(Pageable pageable);

    @Query("""
            SELECT e.livro.genero AS genero, COUNT(e) AS quantidade
            FROM Emprestimo e
            GROUP BY e.livro.genero
            ORDER BY COUNT(e) DESC
            """)
    List<GeneroTotalProjecao> emprestimosPorGenero();

    @Query("""
            SELECT e FROM Emprestimo e
            JOIN FETCH e.cliente
            JOIN FETCH e.livro
            WHERE e.dataRetirada BETWEEN :inicio AND :fim
            ORDER BY e.dataRetirada, e.id
            """)
    List<Emprestimo> listarPorPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}