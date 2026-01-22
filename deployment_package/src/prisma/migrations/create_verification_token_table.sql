CREATE TABLE IF NOT EXISTS "VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    UNIQUE(identifier, token)
);
