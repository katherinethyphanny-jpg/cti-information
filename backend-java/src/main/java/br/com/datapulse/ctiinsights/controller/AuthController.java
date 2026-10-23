package br.com.datapulse.ctiinsights.controller;

import br.com.datapulse.ctiinsights.dto.CadastroRequest;
import br.com.datapulse.ctiinsights.dto.LoginRequest;
import br.com.datapulse.ctiinsights.dto.LoginResponse;
import br.com.datapulse.ctiinsights.dto.UsuarioResponse;
import br.com.datapulse.ctiinsights.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/cadastro")
    public ResponseEntity<UsuarioResponse> cadastrar(@Valid @RequestBody CadastroRequest requisicao) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastrar(requisicao));
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest requisicao) {
        return authService.login(requisicao);
    }

    // JWT é stateless: não há sessão para encerrar no servidor.
    // Quem "sai" é o frontend, descartando o token.
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication autenticacao) {
        return authService.buscarPorEmail(autenticacao.getName());
    }
}
