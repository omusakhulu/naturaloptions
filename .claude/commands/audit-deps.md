# /audit:deps - Dependency Audit

Audit project dependencies for security vulnerabilities, outdated packages, and unused dependencies.

## Instructions

1. **Security Audit**
```bash
pnpm audit
```
   Report vulnerabilities by severity level.

2. **Check for Outdated Packages**
```bash
pnpm outdated
```
   List packages that have newer versions available.

3. **Find Unused Dependencies**

   Search for imports of each dependency in package.json to identify unused packages.

4. **Check for Duplicate Dependencies**
```bash
pnpm why <package-name>
```
   For packages that appear multiple times.

5. **License Compliance**

   Check that all dependencies use compatible licenses (MIT, Apache-2.0, ISC, etc.)

## Report Format

```
Dependency Audit Report
=======================

SECURITY VULNERABILITIES
------------------------
Critical: [count]
High: [count]
Moderate: [count]
Low: [count]

[Details of each vulnerability]

OUTDATED PACKAGES
-----------------
Package          Current    Latest     Type
-------          -------    ------     ----
next             15.1.2     15.2.0     minor
@mui/material    7.3.4      7.4.0      minor
prisma           5.22.0     6.0.0      major

POTENTIALLY UNUSED
------------------
[List packages not found in imports]

DUPLICATE DEPENDENCIES
----------------------
[List packages with multiple versions]

RECOMMENDATIONS
---------------
1. Update critical security vulnerabilities immediately
2. Schedule updates for major version bumps
3. Remove unused dependencies to reduce bundle size
```

## Actions

### Update All Safe Updates (patch/minor)
```bash
pnpm update
```

### Update Specific Package
```bash
pnpm update <package-name>
```

### Update to Latest (including major)
```bash
pnpm update <package-name> --latest
```

### Remove Unused Dependency
```bash
pnpm remove <package-name>
```

## Common Issues

### Conflicting Peer Dependencies
```bash
# Check why package is needed
pnpm why <package-name>

# Force resolution in package.json
"resolutions": {
  "<package-name>": "<version>"
}
```

### Security Vulnerability in Sub-dependency
```bash
# Override vulnerable sub-dependency
"overrides": {
  "<package-name>": "<safe-version>"
}
```

## Priority Updates

These packages should be kept up-to-date for security:

1. **next** - Framework with frequent security patches
2. **prisma** - Database client with security fixes
3. **next-auth** - Authentication library
4. **bcrypt** - Password hashing
5. **zod** - Input validation

## Schedule

- **Weekly**: Run `pnpm audit` and fix critical/high
- **Monthly**: Run `pnpm outdated` and update minor versions
- **Quarterly**: Evaluate major version updates
