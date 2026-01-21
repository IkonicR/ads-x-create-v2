---
description: Structured brainstorming for projects and features. Explores multiple options before implementation.
---

# /brainstorm - Structured Idea Exploration

$ARGUMENTS

---

## PHASE 0: DEEP THINK PROTOCOL (MANDATORY)

**STOP & REASON:** Before generating ideas, ground yourself in reality.
Output this analysis in a `<reasoning>` block:

1.  **Context Audit (Reality Anchor)**:
    *   *Stack Check:* Read `package.json` or equivalent. Do NOT suggest solutions that conflict with the existing tech stack.
    *   *Existing Patterns:* Scan for existing implementations of similar features. Match the project's architectural style.
2.  **Gap Analysis**:
    *   **Goal:** [What is the user trying to achieve?]
    *   **Constraints:** [Budget, time, tech stack limitations?]
3.  **Risk Assessment**:
    *   For each idea generated, consider: "What could go wrong?"
4.  **Verification Strategy**:
    *   How will we know if the chosen idea is successful?

*Once the `<reasoning>` block is complete, proceed to brainstorming.*

---

## Purpose

This workflow explores ideas BEFORE committing to implementation. No code is written during brainstorming.

---

## Process

### Step 1: Understand the Goal

- What problem are we solving?
- Who is the target user?
- What are the constraints?

### Step 2: Generate Options

Present **at least 3 distinct approaches**:

| Option | Approach | Pros | Cons | Effort |
|--------|----------|------|------|--------|
| A | [Description] | [Benefits] | [Drawbacks] | Low/Med/High |
| B | [Description] | [Benefits] | [Drawbacks] | Low/Med/High |
| C | [Description] | [Benefits] | [Drawbacks] | Low/Med/High |

### Step 3: Recommendation

Based on the analysis, recommend ONE option with clear reasoning.

---

## Output Format

```markdown
## Brainstorm: [Topic]

### Goal
[What we're trying to achieve]

### Options Explored

#### Option A: [Name]
- **Approach:** [Description]
- **Pros:** [List]
- **Cons:** [List]
- **Effort:** [Low/Medium/High]

#### Option B: [Name]
[Same structure]

#### Option C: [Name]
[Same structure]

### Recommendation
[Which option and why]

### Next Steps
[What to do after approval]
```

---

## Rules

1. **NO CODE** - This is ideation only
2. **MINIMUM 3 OPTIONS** - Always explore multiple approaches
3. **BE REALISTIC** - Consider the existing codebase and constraints
4. **GET APPROVAL** - Wait for user decision before implementing

---

## Usage Examples

```
/brainstorm payment integration options
/brainstorm how to structure the database
/brainstorm authentication approaches
/brainstorm UI layout for dashboard
```
