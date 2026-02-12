# /release - Create Release

Bump version, update changelog, and create a release.

## Instructions

1. **Determine Version Bump**

   Based on changes since last release:
   - `major` (x.0.0): Breaking changes
   - `minor` (0.x.0): New features, backward compatible
   - `patch` (0.0.x): Bug fixes, backward compatible

2. **Get Current Version**
```bash
node -p "require('./package.json').version"
```

3. **Generate Changelog**

   Review commits since last tag:
```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

   Group by type:
   - Features
   - Bug Fixes
   - Performance
   - Breaking Changes

4. **Update Version**
```bash
npm version <major|minor|patch> --no-git-tag-version
```

5. **Update CHANGELOG.md**

6. **Commit and Tag**
```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): v<version>"
git tag -a v<version> -m "Release v<version>"
```

7. **Push**
```bash
git push && git push --tags
```

## Arguments

```
/release <major|minor|patch> [--dry-run]

Examples:
/release patch              # Bump patch version
/release minor              # Bump minor version
/release major              # Bump major version
/release patch --dry-run    # Preview changes without applying
```

## Options

- `--dry-run` - Preview version bump and changelog without applying
- `--no-tag` - Skip creating git tag
- `--prerelease=<id>` - Create prerelease (e.g., 1.0.0-beta.1)

## Changelog Format

```markdown
# Changelog

## [4.1.0] - 2024-01-15

### Added
- New feature X that enables Y (#123)
- Support for Z in product management (#124)

### Changed
- Improved performance of order listing by 50%
- Updated MUI to version 7.4.0

### Fixed
- Fixed login redirect issue (#125)
- Resolved NaN handling in price calculations (#126)

### Security
- Updated dependencies to address CVE-XXXX

### Breaking Changes
- Removed deprecated `oldFunction()` - use `newFunction()` instead
```

## Version Guidelines

### When to Bump Major (x.0.0)
- Removing features
- Changing API contracts
- Database schema changes requiring migration
- Dropping support for older Node.js versions

### When to Bump Minor (0.x.0)
- Adding new features
- Adding new API endpoints
- New optional configuration options
- Non-breaking dependency updates

### When to Bump Patch (0.0.x)
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements

## Pre-release Checklist

- [ ] All tests pass
- [ ] Build succeeds
- [ ] No pending security vulnerabilities
- [ ] Documentation is up to date
- [ ] Breaking changes are documented
- [ ] Migration guide written (if needed)

## Post-release

1. Monitor for issues
2. Announce release (if applicable)
3. Update production deployment
4. Close related GitHub issues/milestones
