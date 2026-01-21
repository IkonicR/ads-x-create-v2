---
description: Create project plan using project-planner agent. No code writing - only plan file generation.
---

# /plan - Project Planning Mode

$ARGUMENTS

---

## PHASE 0: DEEP THINK PROTOCOL (MANDATORY)

**STOP & REASON:** Before invoking the `project-planner`, you must perform a Deep Think Analysis.
Output this analysis in a `<reasoning>` block:

1.  **Context Audit (Cartography)**:
    *   *Action:* Execute `ls -R` or `tree` (if available) to understand the *exact* current directory structure.
    *   *Stack Check:* Read `package.json` (or equivalent) to strictly align the plan with the current tech stack.
    *   *Check:* Do other plan files already exist? (Prevent duplicates).
2.  **Gap Analysis**:
    *   **Current State:** [What exists now?]
    *   **Target State:** [What does the user want?]
    *   **Delta:** [The exact list of missing components].
3.  **Risk Assessment**:
    *   Identify potential conflicts with existing code.
    *   Estimate complexity (Low/Medium/High).
4.  **Verification Strategy**:
    *   What command or test will prove the plan was executed successfully?

*Once the `<reasoning>` block is complete, proceed immediately to invoke the agent.*

---

## CRITICAL RULES

1. **NO CODE** - This workflow is ONLY for planning. Do not write any implementation code.
2. **USE project-planner AGENT** - Always invoke the `project-planner` agent for the actual planning work.
3. **OUTPUT FORMAT** - The plan must be a structured markdown file with clear phases and tasks.
4. **GET APPROVAL** - Present the plan to the user and wait for approval before any implementation begins.
5. **CREATE AS ARTIFACT** - Use the artifact system (write_to_file with IsArtifact=true) so user can comment.

---

## Output Location

Create plan as an artifact:
- Path: `brain/<conversation-id>/PLAN-{task-slug}.md`
- This enables user commenting and review

---

## Workflow

```
User Request
    ↓
[PHASE 0: Deep Think Analysis]
    ↓
Invoke project-planner agent
    ↓
Agent analyzes requirements
    ↓
Agent creates PLAN-{slug}.md artifact
    ↓
Present to user for approval
    ↓
STOP (no implementation)
```

---

## Usage Examples

```
/plan authentication system with OAuth
/plan refactor database layer
/plan new dashboard feature
/plan migration from REST to GraphQL
```
