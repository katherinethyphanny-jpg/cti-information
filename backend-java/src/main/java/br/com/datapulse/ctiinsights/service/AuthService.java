package br.com.datapulse.ctiinsights.service;

import br.com.datapulse.ctiinsights.dto.CadastroRequest;
import br.com.datapulse.ctiinsights.dto.LoginRequest;
import br.com.datapulse.ctiinsights.dto.LoginResponse;
import br.com.datapulse.ctiinsights.dto.UsuarioResponse;
import br.com.datapulse.ctiinsights.model.Perfil;
import br.com.datapulse.ctiinsights.model.Usuario;
import br.com.datapulse.ctiinsights.repository.UsuarioRepository;
import br.com.datapulse.ctiinsights.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UsuarioResponse cadastrar(CadastroRequest requisicao) {
        String email = normalizar(requisicao.email());

        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(requisicao.nome().trim());
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(requisicao.senha()));
        // O perfil NUNCA vem da requisição: todo cadastro público é USER.
        // Para criar um ADMIN, altere direto no banco.
        usuario.setPerfil(Perfil.USER);

        try {
            return paraResposta(usuarioRepository.save(usuario));
        } catch (DataIntegrityViolationException e) {
            // Dois cadastros simultâneos com o mesmo e-mail
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        }
    }

    public LoginResponse login(LoginRequest requisicao) {
        // Mesma mensagem para e-mail inexistente e senha errada,
        // para não revelar quais e-mails existem.
        Usuario usuario = usuarioRepository.findByEmail(normalizar(requisicao.email()))
                .filter(u -> passwordEncoder.matches(requisicao.senha(), u.getSenhaHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));

        return new LoginResponse(
                jwtService.gerarToken(usuario),
                "Bearer",
                usuario.getEmail(),
                usuario.getNome(),
                usuario.getPerfil());
    }

    public UsuarioResponse buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .map(this::paraResposta)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Usuário não encontrado."));
    }

    private UsuarioResponse paraResposta(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getPerfil());
    }

    private String normalizar(String email) {
        return email.trim().toLowerCase();
    }
}
