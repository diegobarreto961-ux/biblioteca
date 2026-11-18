package br.com.codexa.biblioteca.dto;

import br.com.codexa.biblioteca.model.Cliente;

public record ClienteResponse(Integer id, String nome, String email, String telefone) {

    public static ClienteResponse de(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(), cliente.getNome(), cliente.getEmail(), cliente.getTelefone());
    }
}