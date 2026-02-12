# /commit - Create Git Commit

Stage changes and create a well-formatted commit with conventional commit message.

## Instructions

1. **Check Repository Status**
```bash
git status
```

2. **Review Changes**
```bash
git diff --staged
git diff
```

3. **Stage Files**
   - Ask user which files to stage if not specified
   - Stage specific files rather than using `git add -A`
   - Never stage sensitive files (.env, credentials, etc.)

4. **Generate Commit Message**

   Follow Conventional Commits format:
   ```
   <type>(<scope>): <description>

   [optional body]

   [optional footer]
   ```

   Types:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation
   - `style`: Formatting, no code change
   - `refactor`: Code change that neither fixes bug nor adds feature
   - `perf`: Performance improvement
   - `test`: Adding/updating tests
   - `chore`: Maintenance tasks

5. **Create Commit**
```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

6. **Verify Commit**
```bash
git log -1
```

## Arguments

```
/commit [message]

Examples:
/commit                              # Auto-generate message
/commit "fix: resolve login bug"     # Use provided message
/commit --all                        # Stage all changes
```

## Options

- `--all` or `-a` - Stage all modified files (not untracked)
- `--amend` - Amend previous commit (use with caution)
- `--no-verify` - Skip pre-commit hooks (not recommended)

## Commit Message Guidelines

### Good Examples
```
feat(auth): add password reset functionality

Implement password reset flow with email verification.
Users can now request a password reset link that expires after 24 hours.

Closes #123
```

```
fix(api): prevent NaN in product price calculation

Add input validation to reject NaN and Infinity values
in price calculations, returning 400 error for invalid input.
```

```
refactor(components): extract ProductCard from ProductList

Move ProductCard to its own file to improve code organization
and enable reuse in other components.
```

### Bad Examples
```
fixed stuff        # Too vague
update            # No type, no description
WIP               # Don't commit work in progress
```

## Pre-commit Checks

Before committing, the following checks run automatically:
1. ESLint (code quality)
2. Prettier (formatting)
3. TypeScript (type checking)

If any check fails, fix the issues before committing.

## Safety Rules

- NEVER commit sensitive data (API keys, passwords, tokens)
- NEVER force push to main/master
- NEVER use `--amend` on shared branches
- Always review staged changes before committing
