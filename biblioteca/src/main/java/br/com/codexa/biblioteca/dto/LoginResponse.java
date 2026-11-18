package br.com.codexa.biblioteca.dto;

public record LoginResponse(String token, String tipoToken, long expiraEmSegundos,
                            String perfil, String nome) {}