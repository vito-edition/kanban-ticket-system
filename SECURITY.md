# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x | ✅ Yes |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Report security issues by emailing **security@example.com** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested mitigations

You will receive a response within **48 hours**. We aim to release a patch within **7 days** of confirmation.

## Security Architecture

### Authentication
- Passwords hashed with **bcrypt** (12 rounds minimum)
- **JWT access tokens** expire in 15 minutes
- **JWT refresh tokens** expire in 7 days with rotation on each use
- Refresh tokens are stored hashed in the database
- All tokens invalidated on password change

### Transport
- All production traffic over **HTTPS/TLS 1.2+**
- HTTP Strict Transport Security (HSTS) enabled in production
- Cookies set with `Secure`, `HttpOnly`, and `SameSite=Strict`

### API Security
- **Helmet.js** sets secure HTTP headers
- **CORS** restricted to allowlisted origins
- **Rate limiting**: 100 requests/15 min globally, 10/15 min on auth endpoints
- **Zod** validates and sanitizes all request inputs
- SQL injection prevented by Prisma's parameterized queries
- All responses strip internal error details in production

### Data
- Secrets and API keys stored only in environment variables
- `.env` files are gitignored and never committed
- Database credentials rotated on any suspected exposure
- Audit log records every privileged action

### Container
- Docker images run as non-root user
- No privileged containers in production
- Secrets injected via environment, not baked into images
- Production image uses multi-stage build to minimize attack surface

## Security Checklist (Pre-Deploy)

- [ ] All `.env` values changed from `.env.example` defaults
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are 64+ random characters
- [ ] `NODE_ENV=production`
- [ ] `COOKIE_SECURE=true`
- [ ] `COOKIE_SAME_SITE=strict`
- [ ] HTTPS / TLS certificate configured in Nginx
- [ ] Rate limits reviewed for expected traffic
- [ ] Database not exposed outside Docker network
- [ ] Redis password set and not exposed externally
- [ ] Log files do not contain PII or tokens
- [ ] Dependency audit: `npm audit` shows no critical vulnerabilities
