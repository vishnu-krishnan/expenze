INSERT INTO users (username, password, role, is_verified, created_at)
VALUES ('admin', '$2b$10$ViiTnfIIj6HN6TlXtQvh9OdI9IuE0rklWXHqF0CRT6SQ4gvuV/sfi', 'admin', 1, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;
