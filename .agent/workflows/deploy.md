---
description: Deployment command for production releases. Pre-flight checks and deployment execution.
---

# /deploy - Production Deployment

$ARGUMENTS

---

## PHASE 0: DEEP THINK PROTOCOL (MANDATORY)

**STOP & REASON:** You are the Launch Officer. Deployment is irreversible.
Output this analysis in a `<reasoning>` block:

1.  **Context Audit (Pre-Flight Checks)**:
    *   **Git Cleanliness:** Run `git status`. If dirty, ABORT. (Never deploy uncommitted code).
    *   **Secrets Check:** Verify `.env` variables exist for the target environment.
    *   **Branch Check:** Are we on `main`? Warn if deploying from a feature branch.
2.  **Gap Analysis (Version Delta)**:
    *   **Drift:** Has the database schema changed since the last deploy? (Requires migration?).
    *   **Build:** Does the project build locally? (`npm run build`).
3.  **Risk Assessment**:
    *   **Downtime:** Will this require a restart?
    *   **Rollback Strategy:** **CRITICAL:** What is the exact command to undo this deploy?
4.  **Verification Strategy**:
    *   Define the "Smoke Test" URL (e.g., `curl /health` or visit homepage) to check immediately after launch.

*Once the `<reasoning>` block is complete, proceed immediately to the Purpose section.*

---

## Purpose

This command handles production deployment with pre-flight checks, deployment execution, and verification.

---

## Sub-commands

```
/deploy            - Interactive deployment wizard
/deploy check      - Run pre-deployment checks only
/deploy preview    - Deploy to preview/staging
/deploy production - Deploy to production
/deploy rollback   - Rollback to previous version
```

---

## Pre-Deployment Checklist

Before any deployment:

```markdown
## Pre-Deploy Checklist

### Code Quality
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] ESLint passing (`npx eslint .`)
- [ ] All tests passing (`npm test`)

### Security
- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] Dependencies audited (`npm audit`)

### Performance
- [ ] Bundle size acceptable
- [ ] No console.log statements
- [ ] Images optimized

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API docs current

### Ready to deploy? (y/n)
```

---

## Deployment Flow

```
/deploy
    |
    v
Pre-flight checks
    |
Pass? --No--> Fix issues
    |
   Yes
    |
    v
Build application
    |
    v
Deploy to platform
    |
    v
Health check & verify
    |
    v
Complete
```

---

## Platform Support

| Platform | Command | Notes |
|----------|---------|-------|
| Vercel | `vercel --prod` | Auto-detected for Next.js |
| Railway | `railway up` | Needs Railway CLI |
| Fly.io | `fly deploy` | Needs flyctl |
| Docker | `docker compose up -d` | For self-hosted |

---

## Usage Examples

```
/deploy
/deploy check
/deploy preview
/deploy production --skip-tests
/deploy rollback
```
