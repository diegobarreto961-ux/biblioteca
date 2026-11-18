package br.com.codexa.biblioteca.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ADMINISTRADOR")
public class Administrador extends Usuario {

    @Override
    public String getPerfil() {
        return "ADMINISTRADOR";
    }
}