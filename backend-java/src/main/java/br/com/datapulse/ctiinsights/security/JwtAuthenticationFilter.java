package br.com.datapulse.ctiinsights.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// Não leva @Component de propósito: é criado no SecurityConfig, para rodar
// só dentro da cadeia do Spring Security (e não duas vezes).
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String cabecalho = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (cabecalho != null && cabecalho.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = jwtService.extrairClaims(cabecalho.substring(7));
                String perfil = claims.get("perfil", String.class);

                if (perfil != null) {
                    var autenticacao = new UsernamePasswordAuthenticationToken(
                            claims.getSubject(),
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + perfil)));

                    SecurityContextHolder.getContext().setAuthentication(autenticacao);
                }
            } catch (JwtException | IllegalArgumentException e) {
                // Token inválido ou expirado: segue sem autenticar.
                // A rota protegida responde 401.
            }
        }

        chain.doFilter(request, response);
    }
}
