import { vi, beforeAll, afterAll } from "vitest";

// Set test env vars before anything imports config
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/kanban_test";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long-for-tests";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-chars-long-for-tests";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.BCRYPT_ROUNDS = "4";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.RATE_LIMIT_MAX_REQUESTS = "1000";
process.env.AUTH_RATE_LIMIT_MAX = "100";
process.env.LOG_LEVEL = "error";
process.env.API_PORT = "4001";

// Mock Redis so tests don't need a real Redis instance
vi.mock("../src/config/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    quit: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),
}));
