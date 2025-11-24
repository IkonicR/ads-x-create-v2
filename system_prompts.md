
# System Prompt & "Digital Brain" Logic

## Configuration & Overrides (Admin HQ)
The AI personality is controlled via a **Fall-through System** accessible in the Admin Dashboard ("Brain Logic" tab).

1.  **Factory Defaults (Hardcoded):** The logic defined below exists in the codebase (`services/prompts.ts`). It is the baseline behavior.
2.  **Admin Overrides (Database):** Administrators can define custom prompts via the UI.
3.  **Resolution Logic:**
    *   `Prompt = Custom_Prompt_From_DB || Factory_Default_From_Code`
    *   This ensures that code updates improve the baseline, while specific overrides (if set) are respected.

## Philosophy
We do not allow Gemini to be a "Creative Writer" in the traditional sense. We treat Gemini as a **Brand Enforcer**. It is not allowed to invent facts. It must strictly adhere to the data provided in the `Business` object (The Digital Brain).

## The Guardrail Protocol (Factory Defaults)
To prevent "Marketing Schizophrenia" and hallucinations, every API call to `Gemini 3 Pro` is wrapped in a specific context structure.

### 1. The Identity Anchor
We explicitly inject the business identity at the top of every prompt.
```text
BRAND IDENTITY:
- Business Name: ${business.name}
- Industry: ${business.industry}
- Brand Colors: ${business.colors}
```

### 2. The "Do Not Invent" Rule
We instruct the model to reject creative liberties regarding the product itself.
```text
STRICT RULES:
1. Do NOT invent features that are not described in the Offering description.
2. If the product description is "Black Coffee", do NOT generate a Latte Art pattern unless specified.
3. Adhere to the Ban List: Do NOT use words/imagery found in ${business.voice.negativeKeywords}.
```

### 3. The Visual Style Injection
We separate *Content* (The Product) from *Style* (The Vibe).
*   **Content Source**: Comes strictly from the `Offering` database.
*   **Style Source**: Comes strictly from the `StylePreset` selected by the user.

### Example Mega-Prompt construction
If the user selects "Espresso" (Offering) and "Cyberpunk" (Style):

> "Create a high-end product image for 'Lumina Coffee'. The product is 'Signature Espresso'. The style is 'Cyberpunk aesthetic, neon lighting'.
> CONSTRAINT: Do not show milk or cream. Do not use the word 'Cheap'.
> The primary color of the brand is #4A3B32, try to incorporate this subtly."

## Why this matters
Generic AI tools default to the "Average" of the internet. By forcing these constraints, we force Gemini to default to the "Specifics" of the user's business.
