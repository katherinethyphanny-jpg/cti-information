package br.com.datapulse.ctiinsights.security;

import br.com.datapulse.ctiinsights.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey chave;
    private final long expiracaoMs;

    public JwtService(
            @Value("${app.jwt.secret-base64}") String segredoBase64,
            @Value("${app.jwt.expiracao-minutos}") long expiracaoMinutos) {
        // A chave vem de variável de ambiente (JWT_SECRET_BASE64), nunca do código
        this.chave = Keys.hmacShaKeyFor(Decoders.BASE64.decode(segredoBase64));
        this.expiracaoMs = expiracaoMinutos * 60_000L;
    }

    public String gerarToken(Usuario usuario) {
        Date agora = new Date();

        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim("perfil", usuario.getPerfil().name())
                .issuedAt(agora)
                .expiration(new Date(agora.getTime() + expiracaoMs))
                .signWith(chave)
                .compact();
    }

    // Valida assinatura e expiração. Lança JwtException se o token não servir.
    public Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(chave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
