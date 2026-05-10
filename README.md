# Kanban Ticket System

A production-ready, full-stack Kanban board and ticket management system built as a TypeScript monorepo.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20, Express 5, TypeScript 5 |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Auth | JWT (access + refresh tokens) |
| Container | Docker + Docker Compose |
| Testing | Vitest, Supertest, Testing Library |

## Features

- **Kanban Boards** — multiple boards per organization, drag-and-drop columns and cards
- **Ticket System** — full CRUD, SLA tracking, priority levels, labels, attachments
- **Authentication** — JWT with refresh token rotation, bcrypt password hashing
- **Role-Based Access** — Admin, Manager, Member roles per board
- **Real-time** — WebSocket updates via Socket.io
- **Audit Log** — every state change is recorded
- **API** — RESTful JSON API with OpenAPI docs

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> kanban-ticket-system
cd kanban-ticket-system
cp .env.example .env          # Edit values before continuing
npm install

# 2. Start infrastructure
docker compose up -d postgres redis

# 3. Run migrations and seed
npm run db:migrate
npm run db:seed

# 4. Start development servers
npm run dev
```

- API → http://localhost:4000
- Web → http://localhost:3000
- API Docs → http://localhost:4000/api-docs

## Project Structure

```
kanban-ticket-system/
├── apps/
│   ├── api/                  # Express backend
│   │   ├── src/
│   │   │   ├── config/       # App configuration
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── middleware/   # Auth, validation, error handling
│   │   │   ├── models/       # Business logic
│   │   │   ├── routes/       # Route definitions
│   │   │   ├── services/     # External integrations
│   │   │   ├── types/        # TypeScript types
│   │   │   └── utils/        # Helpers
│   │   └── prisma/           # Database schema + migrations
│   └── web/                  # React frontend
│       └── src/
│           ├── components/   # Reusable UI components
│           ├── pages/        # Route pages
│           ├── hooks/        # Custom React hooks
│           ├── store/        # Zustand state
│           └── services/     # API client
└── packages/
    └── shared/               # Shared types and utilities
```

## NPM Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API + Web in development |
| `npm run build` | Build all packages for production |
| `npm run test` | Run all test suites |
| `npm run lint` | Lint all packages |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Docker

```bash
# Development
docker compose up

# Production
docker compose -f docker-compose.prod.yml up -d
```

## Security

See [SECURITY.md](SECURITY.md) for the security policy and how to report vulnerabilities.

## License

MIT
