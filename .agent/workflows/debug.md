---
description: Debugging command. Activates DEBUG mode for systematic problem investigation.
---

# /debug - Systematic Problem Investigation

$ARGUMENTS

---

## PHASE 0: DEEP THINK PROTOCOL (MANDATORY)

**STOP & REASON:** Do not suggest a fix yet. Engage Forensic Protocol.
Output this analysis in a `<reasoning>` block:

1.  **Context Audit (Crime Scene)**:
    *   *Logs:* Check terminal output, browser console, or server logs for the exact error message.
    *   *Git Status:* Run `git status` and `git log -3` to see recent changes that might have introduced the bug.
    *   *Environment:* Is this happening in dev, staging, or production? What are the relevant env variables?
2.  **Gap Analysis (The Anomaly)**:
    *   **Expected Behavior:** [What SHOULD happen?]
    *   **Actual Behavior:** [What IS happening?]
    *   **The Delta:** [The specific deviation].
3.  **Risk Assessment (Hyrum's Law Check)**:
    *   Could fixing this bug break something else that accidentally depends on the buggy behavior?
4.  **Verification Strategy (Reproduction)**:
    *   Write the exact steps (or a script) to reliably reproduce this bug BEFORE attempting a fix.

*Once the `<reasoning>` block is complete, proceed to the systematic investigation.*

---

## DEBUG Protocol

### Step 1: Gather Information

- What is the exact error message?
- When did it start happening?
- What changed recently?
- Can you reproduce it consistently?

### Step 2: Form Hypotheses

Based on the information, list possible causes ranked by likelihood:

1. [Most likely cause]
2. [Second possibility]
3. [Third possibility]

### Step 3: Test Hypotheses

For each hypothesis:
- How can we verify/disprove it?
- What evidence would confirm this is the cause?

### Step 4: Fix and Verify

- Implement the fix
- Verify the original issue is resolved
- Check for regressions

---

## Output Format

```markdown
## Debug Report: [Issue Title]

### Symptoms
[Description of the problem]

### Root Cause
[What was actually wrong]

### Solution
[What was done to fix it]

### Verification
[How we confirmed it's fixed]

### Prevention
[How to prevent this in the future]
```

---

## Usage Examples

```
/debug login not working
/debug API returning 500 error
/debug images not loading
/debug why is the build failing
```
