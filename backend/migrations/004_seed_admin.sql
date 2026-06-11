-- Seed default admin user
INSERT INTO users (id, email, password_hash, role)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@taskflow.com',
    '$2a$10$1mqRxox33FiYuGit/mqwm.DjTHM.OySFaNnHkMwhR5WLeyZ9wAala',
    'admin'
)
ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash;
