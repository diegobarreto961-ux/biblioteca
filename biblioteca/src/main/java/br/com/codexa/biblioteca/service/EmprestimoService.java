package br.com.codexa.biblioteca.service;

import br.com.codexa.biblioteca.dto.EmprestimoRequest;
import br.com.codexa.biblioteca.dto.EmprestimoResponse;
import br.com.codexa.biblioteca.exception.RegraNegocioException;
import br.com.codexa.biblioteca.model.Administrador;
import br.com.codexa.biblioteca.model.Cliente;
import br.com.codexa.biblioteca.model.Emprestimo;
import br.com.codexa.biblioteca.model.Livro;
import br.com.codexa.biblioteca.model.StatusEmprestimo;
import br.com.codexa.biblioteca.model.Usuario;
import br.com.codexa.biblioteca.repository.EmprestimoRepository;
import br.com.codexa.biblioteca.repository.LivroRepository;
import br.com.codexa.biblioteca.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class EmprestimoService {

    private final EmprestimoRepository emprestimoRepository;
    private final LivroRepository livroRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public EmprestimoResponse registrar(EmprestimoRequest request, Integer idAdministrador) {

        Usuario usuarioCliente = usuarioRepository.findById(request.idCliente())
                .orElseThrow(() -> new RegraNegocioException(
                        "Cliente não encontrado", HttpStatus.NOT_FOUND));

        if (!(usuarioCliente instanceof Cliente cliente)) {
            throw new RegraNegocioException(
                    "O usuário informado não é um cliente", HttpStatus.BAD_REQUEST);
        }

        Usuario usuarioAdmin = usuarioRepository.findById(idAdministrador)
                .orElseThrow(() -> new RegraNegocioException(
                        "Administrador não encontrado", HttpStatus.NOT_FOUND));

        if (!(usuarioAdmin instanceof Administrador administrador)) {
            throw new RegraNegocioException(
                    "O usuário autenticado não é um administrador", HttpStatus.FORBIDDEN);
        }

        Livro livro = livroRepository.findById(request.idLivro())
                .orElseThrow(() -> new RegraNegocioException(
                        "Livro não encontrado", HttpStatus.NOT_FOUND));

        if (livro.getQuantidadeDisponivel() <= 0) {
            throw new RegraNegocioException(
                    "Não há exemplares disponíveis para empréstimo", HttpStatus.CONFLICT);
        }

        if (!request.dataDevolucaoPrevista().isAfter(LocalDate.now())) {
            throw new RegraNegocioException(
                    "A data prevista de devolução deve ser futura", HttpStatus.BAD_REQUEST);
        }

        Emprestimo emprestimo = new Emprestimo();
        emprestimo.setCliente(cliente);
        emprestimo.setAdministrador(administrador);
        emprestimo.setLivro(livro);
        emprestimo.setStatus(StatusEmprestimo.ATIVO);
        emprestimo.setDataRetirada(LocalDate.now());
        emprestimo.setDataDevolucaoPrevista(request.dataDevolucaoPrevista());

        livro.setQuantidadeDisponivel(livro.getQuantidadeDisponivel() - 1);

        livroRepository.save(livro);
        Emprestimo salvo = emprestimoRepository.save(emprestimo);

        return EmprestimoResponse.de(salvo);
    }
}
