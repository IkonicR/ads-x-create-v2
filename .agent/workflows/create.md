---
description: Create new application command. Triggers App Builder skill and starts interactive dialogue with user.
---

# /create - Create Application

$ARGUMENTS

---

## PHASE 0: DEEP THINK PROTOCOL (MANDATORY)

**STOP & REASON:** You are the Architect. Verify the foundation.
Output this analysis in a `<reasoning>` block:

1.  **Context Audit (Vacancy Check)**:
    *   **Directory Scan:** Run `ls -A`. Is the directory empty?
    *   **Warning:** If files exist, STOP and warn the user. Ask: "Directory not empty. Create in a subfolder?"
2.  **Gap Analysis (Stack Selection)**:
    *   **Request:** $ARGUMENTS
    *   **Stack Decision Matrix:** Pick the BEST stack, not the default.
        *   *If "Data Science/AI" ->* Python + Streamlit/FastAPI.
        *   *If "SEO/Blog" ->* Next.js or Astro.
        *   *If "Internal Tool" ->* React + Vite.
    *   *Justification:* Why this stack?
3.  **Risk Assessment**:
    *   **Complexity:** Is the user asking for "Facebook clone"? (High risk: Break it down to MVP).
    *   **Dependencies:** Can we run this locally? (Does it need paid APIs?).
4.  **Verification Strategy**:
    *   The "Hello World" Test: The process is only complete when the dev server starts and returns 200 OK.

*Once the `<reasoning>` block is complete, proceed immediately to the Task section.*

---

## Task

This command starts a new application creation process.

### Steps:

1. **Request Analysis**
   - Understand what the user wants
   - If information is missing, use `conversation-manager` skill to ask

2. **Project Planning**
   - Use `project-planner` agent for task breakdown
   - Determine tech stack
   - Plan file structure
   - Create plan file and proceed to building

3. **Application Building (After Approval)**
   - Orchestrate with `app-builder` skill
   - Coordinate expert agents:
     - `database-architect` -> Schema
     - `backend-specialist` -> API
     - `frontend-specialist` -> UI

4. **Preview**
   - Start with `auto_preview.py` when complete
   - Present URL to user

---

## Usage Examples

```
/create blog site
/create e-commerce app with product listing and cart
/create todo app
/create Instagram clone
/create crm system with customer management
```

---

## Before Starting

If request is unclear, ask these questions:
- What type of application?
- What are the basic features?
- Who will use it?

Use defaults, add details later.
