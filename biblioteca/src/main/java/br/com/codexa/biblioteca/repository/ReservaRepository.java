package br.com.codexa.biblioteca.repository;

import br.com.codexa.biblioteca.model.Reserva;
import br.com.codexa.biblioteca.model.StatusReserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Integer> {
    List<Reserva> findByClienteId(Integer idCliente);
    List<Reserva> findByLivroIdAndStatusOrderByPosicaoFilaAsc(Integer idLivro, StatusReserva status);
}