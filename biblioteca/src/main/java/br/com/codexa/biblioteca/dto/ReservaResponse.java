package br.com.codexa.biblioteca.dto;

import br.com.codexa.biblioteca.model.Reserva;
import br.com.codexa.biblioteca.model.StatusReserva;

import java.time.LocalDate;

public record ReservaResponse(
        Integer id,
        Integer idCliente,
        String nomeCliente,
        Integer idLivro,
        String tituloLivro,
        LocalDate dataReserva,
        StatusReserva status,
        Integer posicaoFila
) {
    public static ReservaResponse de(Reserva reserva) {
        return new ReservaResponse(
                reserva.getId(),
                reserva.getCliente().getId(),
                reserva.getCliente().getNome(),
                reserva.getLivro().getId(),
                reserva.getLivro().getTitulo(),
                reserva.getDataReserva(),
                reserva.getStatus(),
                reserva.getPosicaoFila()
        );
    }
}