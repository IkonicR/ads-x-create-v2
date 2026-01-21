---
description: Add or update features in existing application. Used for iterative development.
---

# /enhance - Update Application

$ARGUMENTS

---

## PHASE 0: DEEP THINK PROTOCOL (MANDATORY)

**STOP & REASON:** You are about to modify a living organism. Do not create rejection.
Output this analysis in a `<reasoning>` block:

1.  **Context Audit (The Environment)**:
    *   **Stack Consistency:** Check `package.json` or `requirements.txt`. Ensure new code uses *existing* libraries (e.g., use `axios` if installed, don't introduce `fetch` just because).
    *   **Style Match:** Read 1-2 existing files. Match the indentation (tabs/spaces), casing (camel/snake), and comment style.
    *   **Git Check:** Run `git status`. Warn if uncommitted changes exist (danger of overwrite).
2.  **Gap Analysis**:
    *   **Current:** [Existing functionality]
    *   **Target:** [Requested functionality]
    *   **Delta:** [Exact list of files to modify or create].
3.  **Risk Assessment (Blast Radius)**:
    *   *Dependencies:* If I modify Component A, does Page B break? (Run `grep -r "ComponentA" .` to check usage).
    *   *Regression:* Will this change break existing tests?
4.  **Verification Strategy**:
    *   How will I prove this enhancement works? (e.g., "Manual check of route /admin").

*Once the `<reasoning>` block is complete, proceed immediately to the Task section.*

---

## Task

This command adds features or makes updates to existing application.

### Steps:

1. **Understand Current State**
   - Load project state with `session_manager.py`
   - Understand existing features, tech stack

2. **Plan Changes**
   - Determine what will be added/changed
   - Detect affected files
   - Check dependencies

3. **Present Plan to User** (for major changes)
   ```
   "To add admin panel:
   - I'll create 15 new files
   - Update 8 files
   - Takes ~10 minutes
   
   Should I start?"
   ```

4. **Apply**
   - Call relevant agents
   - Make changes
   - Test

5. **Update Preview**
   - Hot reload or restart

---

## Usage Examples

```
/enhance add dark mode
/enhance build admin panel
/enhance integrate payment system
/enhance add search feature
/enhance edit profile page
/enhance make responsive
```

---

## Caution

- Get approval for major changes
- Warn on conflicting requests (e.g., "use Firebase" when project uses PostgreSQL)
- Commit each change with git
