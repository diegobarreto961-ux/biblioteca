package br.com.codexa.biblioteca.repository;

import br.com.codexa.biblioteca.model.Emprestimo;
import br.com.codexa.biblioteca.model.StatusEmprestimo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface EmprestimoRepository extends JpaRepository<Emprestimo, Integer> {
    List<Emprestimo> findByClienteId(Integer idCliente);
    List<Emprestimo> findByStatusAndDataDevolucaoPrevistaBefore(StatusEmprestimo status, LocalDate data);
}