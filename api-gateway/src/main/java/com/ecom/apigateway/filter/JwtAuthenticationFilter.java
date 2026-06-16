package com.ecom.apigateway.filter;

import io.jsonwebtoken.Claims;
import lombok.Data;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private final JwtValidator jwtValidator;

    public JwtAuthenticationFilter(JwtValidator jwtValidator) {
        super(Config.class);
        this.jwtValidator = jwtValidator;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            if (isSecured(request)) {
                if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                    return onError(exchange, "Missing Authorization Header", HttpStatus.UNAUTHORIZED);
                }

                String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    return onError(exchange, "Invalid Authorization Header", HttpStatus.UNAUTHORIZED);
                }

                String token = authHeader.substring(7);
                if (!jwtValidator.validateToken(token)) {
                    return onError(exchange, "Unauthorized Access", HttpStatus.UNAUTHORIZED);
                }

                Claims claims = jwtValidator.getClaims(token);
                String userId = claims.get("userId", String.class);
                String username = claims.getSubject();
                List<String> roles = claims.get("roles", List.class);
                String rolesStr = roles != null ? String.join(",", roles) : "";

                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id", userId)
                        .header("X-User-Username", username)
                        .header("X-User-Roles", rolesStr)
                        .build();

                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            }

            return chain.filter(exchange);
        };
    }

    private boolean isSecured(ServerHttpRequest request) {
        String path = request.getPath().toString();
        String method = request.getMethod() != null ? request.getMethod().name() : "";

        // Bypass public registration/auth endpoints
        if (path.contains("/api/v1/auth/register") ||
            path.contains("/api/v1/auth/login") ||
            path.contains("/api/v1/auth/refresh") ||
            path.contains("/api/v1/auth/validate")) {
            return false;
        }

        // Bypass public Swagger/OpenAPI endpoints
        if (path.contains("/v3/api-docs") ||
            path.contains("/swagger-ui") ||
            path.contains("/swagger-resources") ||
            path.contains("/webjars")) {
            return false;
        }

        // Bypass public read-only product endpoints
        if (path.contains("/api/v1/products") && "GET".equalsIgnoreCase(method)) {
            return false;
        }

        return true;
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        return response.setComplete();
    }

    @Data
    public static class Config {
        // Properties can be configured here if needed
    }
}
