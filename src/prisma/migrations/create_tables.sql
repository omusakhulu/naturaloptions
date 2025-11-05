@"
-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    "emailVerified" TIMESTAMPTZ,
    image TEXT
);

-- Create Account table
CREATE TABLE IF NOT EXISTS "Account" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, "providerAccountId")
);
"@ | Out-File -FilePath "create_tables.sql" -Encoding utf8
