# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] — 2026-05-10

### Added
- Initial monorepo structure with `apps/api`, `apps/web`, `packages/shared`
- Express 5 backend with TypeScript 5
- Prisma ORM with PostgreSQL 16 schema (User, Board, Column, Ticket, Label, Comment, AuditLog)
- JWT authentication with access + refresh token rotation
- Role-based access control (Admin, Manager, Member) per board
- Kanban board CRUD with ordered columns
- Ticket CRUD with SLA tracking, priority, labels, attachments
- Drag-and-drop column and card reordering
- Real-time updates via Socket.io
- Audit log for all state transitions
- React 18 frontend with Vite 5 and Tailwind CSS 3
- Docker Compose for development and production
- Nginx reverse proxy for production
- Rate limiting, CORS, Helmet security headers
- Zod input validation on all API endpoints
- Vitest test suite for API and frontend
- GitHub Actions CI pipeline
- OpenAPI documentation at `/api-docs`
- Full production deployment guide

[Unreleased]: https://github.com/your-org/kanban-ticket-system/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/kanban-ticket-system/releases/tag/v1.0.0
