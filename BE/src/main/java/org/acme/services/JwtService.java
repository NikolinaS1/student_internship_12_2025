package org.acme.services;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.models.User;

import java.time.Duration;
import java.util.Set;

@ApplicationScoped
public class JwtService {
    public String generateToken(User user) {
        return Jwt.issuer("https://localhost:8080/")
                .subject(user.id.toString())
                .groups(Set.of(user.getRole().name()))
                .expiresIn(Duration.ofHours(4))
                .sign();
    }
}
