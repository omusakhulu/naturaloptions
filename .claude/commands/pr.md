# /pr - Create Pull Request

Create a well-documented pull request with proper description and checklist.

## Instructions

1. **Check Branch Status**
```bash
git status
git log main..HEAD --oneline
git diff main...HEAD --stat
```

2. **Ensure Branch is Pushed**
```bash
git push -u origin <branch-name>
```

3. **Analyze Changes**

   Review all commits since branching from main:
   - What features/fixes are included?
   - What files were changed?
   - Are there breaking changes?

4. **Create Pull Request**
```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing the changes>

## Changes
- <List of specific changes>

## Test Plan
- [ ] Unit tests pass (`pnpm test`)
- [ ] Type check passes (`pnpm check-types`)
- [ ] Lint passes (`pnpm lint`)
- [ ] E2E tests pass (`pnpm e2e`)
- [ ] Manual testing completed

## Screenshots
<If UI changes, add before/after screenshots>

## Checklist
- [ ] Code follows project conventions
- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] No sensitive data committed

---
Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

5. **Return PR URL**

## Arguments

```
/pr [--draft] [--base=<branch>]

Examples:
/pr                          # Create PR to main
/pr --draft                  # Create draft PR
/pr --base=develop           # Create PR to develop branch
```

## Options

- `--draft` - Create as draft PR
- `--base=<branch>` - Target branch (default: main)
- `--reviewer=<user>` - Request review from user
- `--label=<label>` - Add label to PR

## PR Title Guidelines

Follow same conventions as commit messages:
```
feat(scope): add new feature
fix(scope): resolve bug
docs: update documentation
refactor(scope): improve code structure
```

Keep under 70 characters.

## PR Description Template

### For Features
```markdown
## Summary
Add [feature name] to enable [user benefit].

## Changes
- Add new component `FeatureName`
- Update API route to handle new data
- Add database migration for new fields

## Test Plan
- [ ] Created unit tests for new functions
- [ ] Added component tests for UI
- [ ] Tested happy path manually
- [ ] Tested error scenarios

## Screenshots
[Before/After images if UI changes]
```

### For Bug Fixes
```markdown
## Summary
Fix [bug description] that was causing [impact].

## Root Cause
[Explanation of what was wrong]

## Solution
[How the fix addresses the issue]

## Test Plan
- [ ] Added regression test
- [ ] Verified fix in development
- [ ] Tested related functionality
```

## Checklist Before Creating PR

1. All commits follow conventional format
2. Branch is up to date with main
3. All tests pass locally
4. No console.log or debug code
5. No commented-out code
6. No TODO comments without ticket reference
