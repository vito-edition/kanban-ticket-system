-- PostgreSQL initialization script
-- This runs only on first container startup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET TIME ZONE 'UTC';
