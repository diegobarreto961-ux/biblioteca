package br.com.codexa.biblioteca.repository;

import br.com.codexa.biblioteca.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacaoRepository extends JpaRepository<Notificacao, Integer> {
    List<Notificacao> findByClienteId(Integer idCliente);
}