# Runbook: AuthService

## JWT Token Failures

### 401 Unauthorized after deploy
- Most common cause: JWT secret rotation not propagated to all pods
- Verify secret: `kubectl get secret jwt-secret -o jsonpath='{.data.key}' | base64 -d`
- Rolling restart to pick up new secret: `kubectl rollout restart deployment/auth-service`
- Check token expiry config: `jwt.expiration` in ConfigMap (default 3600s)

### Token expiring too fast
- Check clock skew between services: `chronyc tracking`
- Add 30s leeway in JWT validation: `JwtParser.setAllowedClockSkewSeconds(30)`

### CORS blocking auth endpoints
- Add origin to allowlist in `SecurityConfig.java`
- For dev: `@CrossOrigin(origins = "http://localhost:3000")`
- For prod: set `CORS_ALLOWED_ORIGINS` env var

## Session Management
- Redis session TTL: 1800s (30 min idle timeout)
- Force logout all sessions: `redis-cli DEL session:<user-id>:*`

## Escalation
- On-call: security-team@company.com
