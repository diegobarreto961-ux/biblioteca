package br.com.codexa.biblioteca.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("CLIENTE")
public class Cliente extends Usuario {

    @Override
    public String getPerfil() {
        return "CLIENTE";
    }
}