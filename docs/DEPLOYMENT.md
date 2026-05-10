# Production Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- A VPS or cloud VM (2 CPU, 4 GB RAM minimum)
- Domain name pointed at the server
- SSL certificate (Let's Encrypt recommended)

## Step-by-Step

### 1. Server Setup

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin git
systemctl enable --now docker
```

### 2. Clone and Configure

```bash
git clone <repo-url> /opt/kanban
cd /opt/kanban
cp .env.example .env
```

Edit `.env` — **change every default value**:

```bash
# Required — generate with: openssl rand -base64 48
JWT_SECRET=<64+ random chars>
JWT_REFRESH_SECRET=<64+ different random chars>
POSTGRES_PASSWORD=<strong DB password>
REDIS_PASSWORD=<strong Redis password>
SESSION_SECRET=<32+ random chars>

# Set to production values
NODE_ENV=production
COOKIE_SECURE=true
CORS_ORIGIN=https://your-domain.com
```

### 3. SSL Certificate

```bash
apt install -y certbot
certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem .docker/nginx/certs/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem .docker/nginx/certs/
```

Edit `.docker/nginx/nginx.prod.conf` — replace `your-domain.com` with your actual domain.

### 4. Run Migrations

```bash
docker compose -f docker-compose.prod.yml run --rm api \
  npx prisma migrate deploy
```

### 5. Start

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 6. Verify

```bash
docker compose -f docker-compose.prod.yml ps
curl https://your-domain.com/api/v1/health
```

## Backups

```bash
# Database backup
docker exec kanban_postgres_prod pg_dump -U $POSTGRES_USER $POSTGRES_DB \
  | gzip > /backups/kanban_$(date +%Y%m%d_%H%M%S).sql.gz

# Automate with cron (daily at 3am)
0 3 * * * /opt/kanban/scripts/backup.sh
```

## Monitoring

| Service | URL |
|---------|-----|
| API Health | `GET /health` |
| Logs | `docker compose logs -f api` |

## Updating

```bash
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

## Rollback

```bash
git checkout <previous-tag>
docker compose -f docker-compose.prod.yml up -d --build
```
