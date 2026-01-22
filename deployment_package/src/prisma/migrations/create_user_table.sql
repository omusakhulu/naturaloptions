CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    "emailVerified" TIMESTAMPTZ,
    image TEXT
);
