---
description: Coordinate multiple agents for complex tasks. Use for multi-perspective analysis, comprehensive reviews, or tasks requiring different domain expertise.
---

# Multi-Agent Orchestration

You are now in **ORCHESTRATION MODE**. Your task: coordinate specialized agents to solve this complex problem.

## Task to Orchestrate

$ARGUMENTS

---

## PHASE 0: DEEP THINK PROTOCOL (MANDATORY)

**STOP & REASON:** You are the Lead Architect. Do not execute yet. Plan the workforce.
Output this analysis in a `<reasoning>` block:

1.  **Context Audit (Dependency Map)**:
    *   *Plan Check:* Does `docs/PLAN.md` exist? If so, this orchestration MUST align with it.
    *   *Collision Detection:* Which agents will touch the same files? (e.g., `frontend-specialist` and `backend-specialist` both modifying an API route). Define a strict execution order to prevent conflicts.
2.  **Gap Analysis**:
    *   **Objective:** [What is the end goal?]
    *   **Required Expertise:** [List the domains needed].
3.  **Risk Assessment**:
    *   What is the single point of failure?
    *   What happens if one agent's output is wrong?
4.  **Verification Strategy**:
    *   Define the acceptance criteria for the ENTIRE orchestration, not just individual agents.
    *   What scripts will be run to verify the final output? (e.g., `security_scan.py`, `lint_runner.py`).

*Once the `<reasoning>` block is complete, proceed to agent assignment.*

---

## Rules

1. **MINIMUM 3 AGENTS** - If you can solve with fewer, you don't need orchestration
2. **SEQUENTIAL BY DEFAULT** - Agents run one after another unless explicitly parallelized
3. **CONTEXT PASSING** - Each agent receives the output of previous agents
4. **SYNTHESIS REQUIRED** - You must combine all agent outputs into a coherent final result

---

## Available Agents

| Agent | Specialty |
|-------|-----------|
| `project-planner` | Architecture, task breakdown, planning |
| `security-auditor` | Security review, vulnerability assessment |
| `backend-specialist` | API, database, server logic |
| `frontend-specialist` | UI/UX, React, styling |
| `mobile-developer` | iOS, Android, React Native |
| `debugger` | Root cause analysis, bug fixing |
| `game-developer` | Game logic, assets, performance |

---

## Orchestration Template

### Phase 1: Planning

```markdown
## Orchestration Plan

### Objective
[What we're trying to achieve]

### Agent Assignments

| Order | Agent | Task | Dependencies |
|-------|-------|------|--------------|
| 1 | [agent] | [specific task] | None |
| 2 | [agent] | [specific task] | Agent 1 output |
| 3 | [agent] | [specific task] | Agent 1 + 2 output |

### Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
```

### Phase 2: Execution

For each agent:
1. Provide full context from previous agents
2. Give specific, scoped task
3. Collect and validate output
4. Pass relevant information to next agent

### Phase 3: Synthesis

Combine all outputs into:
- Summary of what was accomplished
- Any conflicts or issues found
- Recommended next steps

---

## Exit Gate

Before completing orchestration, verify:

- [ ] All agents completed their tasks
- [ ] No conflicting outputs between agents
- [ ] Final result addresses the original objective
- [ ] Verification scripts pass (`security_scan.py`, `lint_runner.py`)

---

## Usage Examples

```
/orchestrate full security audit of the codebase
/orchestrate build new user profile feature end-to-end
/orchestrate review and refactor the authentication system
/orchestrate comprehensive code review before release
```
