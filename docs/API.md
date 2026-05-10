# API Reference

Base URL: `http://localhost:4000/api/v1`

All endpoints return:

```json
{
  "success": true | false,
  "data": {},
  "message": "optional",
  "errors": {},
  "pagination": {}
}
```

## Authentication

### POST /auth/register

```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "SecurePass@1"
}
```

### POST /auth/login

```json
{ "email": "alice@example.com", "password": "SecurePass@1" }
```

Response includes `accessToken` (15min). Refresh token set in `httpOnly` cookie.

### POST /auth/refresh

Reads `refreshToken` cookie (or body). Returns new `accessToken`.

### GET /auth/me

Returns authenticated user. Requires `Authorization: Bearer <token>`.

### POST /auth/logout

Revokes current refresh token.

### POST /auth/logout-all

Revokes all refresh tokens for the user.

### PATCH /auth/change-password

```json
{ "currentPassword": "...", "newPassword": "..." }
```

---

## Boards

All board endpoints require authentication.

| Method | Path | Description |
|--------|------|-------------|
| GET | /boards | List user's boards |
| POST | /boards | Create board |
| GET | /boards/:id | Get board with columns + tickets |
| PATCH | /boards/:id | Update board |
| DELETE | /boards/:id | Delete board (OWNER only) |
| POST | /boards/:id/members | Add member |
| DELETE | /boards/:id/members/:userId | Remove member |

---

## Columns

| Method | Path | Description |
|--------|------|-------------|
| GET | /boards/:boardId/columns | List columns |
| POST | /boards/:boardId/columns | Create column |
| PATCH | /boards/:boardId/columns/:id | Update column |
| DELETE | /boards/:boardId/columns/:id | Delete column |
| PATCH | /boards/:boardId/columns/reorder | Reorder columns |

---

## Tickets

| Method | Path | Description |
|--------|------|-------------|
| GET | /tickets | List tickets (filterable) |
| POST | /tickets | Create ticket |
| GET | /tickets/:id | Get ticket detail |
| PATCH | /tickets/:id | Update ticket |
| PATCH | /tickets/:id/move | Move to column |
| PATCH | /tickets/:id/archive | Archive ticket |
| DELETE | /tickets/:id | Delete ticket |

**Query params for GET /tickets:**
- `boardId`, `columnId`, `assigneeId`
- `priority` (LOW | MEDIUM | HIGH | CRITICAL)
- `status` (TODO | IN_PROGRESS | IN_REVIEW | DONE | CANCELLED)
- `slaBreached` (boolean)
- `search` (full-text)
- `page`, `limit`

---

## Comments

| Method | Path | Description |
|--------|------|-------------|
| GET | /tickets/:id/comments | List comments |
| POST | /tickets/:id/comments | Add comment |
| PATCH | /tickets/:id/comments/:commentId | Edit comment |
| DELETE | /tickets/:id/comments/:commentId | Delete comment |

---

## Labels

| Method | Path | Description |
|--------|------|-------------|
| GET | /labels?boardId= | List labels |
| POST | /labels | Create label |
| PATCH | /labels/:id | Update label |
| DELETE | /labels/:id | Delete label |

---

## Users

| Method | Path | Description |
|--------|------|-------------|
| GET | /users | List users (ADMIN/MANAGER) |
| GET | /users/me | My profile |
| PATCH | /users/me | Update profile |
| GET | /users/:id | Get user |

---

## SLA Thresholds

| Priority | SLA |
|----------|-----|
| CRITICAL | 4 hours |
| HIGH | 24 hours |
| MEDIUM | 72 hours |
| LOW | 168 hours (7 days) |

SLA checker runs every 5 minutes and sets `slaBreached: true` on overdue tickets.
