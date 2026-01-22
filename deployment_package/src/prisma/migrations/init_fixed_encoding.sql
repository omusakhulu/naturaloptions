$sql = @"
-- CreateTable
CREATE TABLE `Account` (
    `id` TEXT NOT NULL,
    `userId` TEXT NOT NULL,
    `type` TEXT NOT NULL,
    `provider` TEXT NOT NULL,
    `providerAccountId` TEXT NOT NULL,
    `refresh_token` TEXT,
    `access_token` TEXT,
    `expires_at` INTEGER,
    `token_type` TEXT,
    `scope` TEXT,
    `id_token` TEXT,
    `session_state` TEXT,

    CONSTRAINT `Account_pkey` PRIMARY KEY (`id`)
);

-- Rest of your SQL here...
"@

# Save with UTF8 without BOM
[System.IO.File]::WriteAllText("$pwd\prisma\migrations\init_fixed_encoding.sql", $sql, [System.Text.Encoding]::UTF8)
