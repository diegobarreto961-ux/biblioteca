@RestController
@RequestMapping("/api/admin/emprestimos")
@RequiredArgsConstructor
public class EmprestimoController {

    private final EmprestimoService emprestimoService;

    @PostMapping
    public ResponseEntity<EmprestimoResponse> registrar(
            @Valid @RequestBody EmprestimoRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Integer idAdministrador = Integer.valueOf(jwt.getSubject());

        EmprestimoResponse response = emprestimoService.registrar(
                request, idAdministrador);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
