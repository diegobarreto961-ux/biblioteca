package br.com.codexa.biblioteca.service;

import br.com.codexa.biblioteca.dto.ReservaResponse;
import br.com.codexa.biblioteca.exception.RegraNegocioException;
import br.com.codexa.biblioteca.model.*;
import br.com.codexa.biblioteca.repository.LivroRepository;
import br.com.codexa.biblioteca.repository.ReservaRepository;
import br.com.codexa.biblioteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final LivroRepository livroRepository;

    @Transactional
    public ReservaResponse criar(Integer idCliente, Integer idLivro, boolean leituraLocal) {
        Usuario usuario = usuarioRepository.findById(idCliente)
                .orElseThrow(() -> new RegraNegocioException("Cliente não encontrado", HttpStatus.NOT_FOUND));
        if (!(usuario instanceof Cliente cliente)) {
            throw new RegraNegocioException("Apenas clientes podem fazer reservas", HttpStatus.BAD_REQUEST);
        }
        Livro livro = livroRepository.findById(idLivro)
                .orElseThrow(() -> new RegraNegocioException("Livro não encontrado", HttpStatus.NOT_FOUND));

        long naFila = reservaRepository.findAll().stream()
                .filter(r -> r.getLivro().getId().equals(idLivro) && r.getStatus() == StatusReserva.ATIVA)
                .count();

        Reserva reserva = new Reserva();
        reserva.setCliente(cliente);
        reserva.setLivro(livro);
        reserva.setDataReserva(LocalDate.now());
        reserva.setStatus(leituraLocal ? StatusReserva.CONFIRMADA : StatusReserva.ATIVA);
        reserva.setPosicaoFila((int) naFila + 1);

        return ReservaResponse.de(reservaRepository.save(reserva));
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> listarTodas() {
        return reservaRepository.findAll().stream()
                .map(ReservaResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> listarPorCliente(Integer idCliente) {
        return reservaRepository.findAll().stream()
                .filter(r -> r.getCliente().getId().equals(idCliente))
                .map(ReservaResponse::de)
                .toList();
    }

    @Transactional
    public ReservaResponse atualizarStatus(Integer id, StatusReserva novoStatus) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Reserva não encontrada", HttpStatus.NOT_FOUND));
        reserva.setStatus(novoStatus);
        return ReservaResponse.de(reservaRepository.save(reserva));
    }
}