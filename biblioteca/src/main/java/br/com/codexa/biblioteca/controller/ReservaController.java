package br.com.codexa.biblioteca.controller;

import br.com.codexa.biblioteca.dto.EmprestimoRequest;
import br.com.codexa.biblioteca.dto.EmprestimoResponse;
import br.com.codexa.biblioteca.dto.ReservaResponse;
import br.com.codexa.biblioteca.exception.RegraNegocioException;
import br.com.codexa.biblioteca.model.Administrador;
import br.com.codexa.biblioteca.model.StatusReserva;
import br.com.codexa.biblioteca.model.Usuario;
import br.com.codexa.biblioteca.repository.UsuarioRepository;
import br.com.codexa.biblioteca.service.EmprestimoService;
import br.com.codexa.biblioteca.service.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;
    private final EmprestimoService emprestimoService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/reservas")
    public ResponseEntity<ReservaResponse> criar(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        Integer idCliente = Integer.valueOf(jwt.getSubject());
        Integer idLivro = Integer.valueOf(body.get("idLivro").toString());
        boolean leituraLocal = Boolean.TRUE.equals(body.get("leituraLocal"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservaService.criar(idCliente, idLivro, leituraLocal));
    }

    @GetMapping("/meus/reservas")
    public List<ReservaResponse> minhasReservas(@AuthenticationPrincipal Jwt jwt) {
        Integer idCliente = Integer.valueOf(jwt.getSubject());
        return reservaService.listarPorCliente(idCliente);
    }

    @GetMapping("/meus/emprestimos")
    public List<EmprestimoResponse> meusEmprestimos(@AuthenticationPrincipal Jwt jwt) {
        Integer idCliente = Integer.valueOf(jwt.getSubject());
        return emprestimoService.listarPorCliente(idCliente);
    }

    @PostMapping("/meus/emprestimos")
    public ResponseEntity<EmprestimoResponse> solicitarEmprestimo(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Jwt jwt) {
        Integer idCliente = Integer.valueOf(jwt.getSubject());
        Integer idLivro = Integer.valueOf(body.get("idLivro").toString());

        Integer idAdmin = usuarioRepository.findAll().stream()
                .filter(Administrador.class::isInstance)
                .map(Usuario::getId)
                .findFirst()
                .orElseThrow(() -> new RegraNegocioException(
                        "Nenhum administrador cadastrado para validar o empréstimo", HttpStatus.BAD_REQUEST));

        EmprestimoRequest req = new EmprestimoRequest(idCliente, idLivro, LocalDate.now().plusDays(14));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(emprestimoService.registrar(req, idAdmin));
    }

    @GetMapping("/admin/reservas")
    public List<ReservaResponse> listarTodasAdmin() {
        return reservaService.listarTodas();
    }

    @PutMapping("/admin/reservas/{id}/status")
    public ReservaResponse alterarStatus(@PathVariable Integer id, @RequestParam StatusReserva status) {
        return reservaService.atualizarStatus(id, status);
    }
}