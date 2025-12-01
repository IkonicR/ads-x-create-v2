
# System Prompt & "Digital Brain" Logic

## Philosophy: "Guided Creativity"
We moved away from the "Brand Enforcer" model (strict, choking rules) to a **"Guided Creativity"** model.
We give the AI the **Ingredients** (Brand, Colors, Style Reference) and trust it to be the **Chef**.

## The "Ingredients" Protocol
Instead of a 50-line rulebook, we construct a lightweight "Visual Brief" dynamically in `api/generate-image.ts`.

### 1. The Inputs (Data)
We provide the raw facts without editorializing.
```text
INPUTS:
- Brand: ${business.name} (${business.industry})
- Colors: ${business.colors}
- User Idea: "${userRequest}"
```

### 2. The Visual Guidance (Reference)
We prioritize **Visuals over Text**.
*   **Style Reference:** We attach the actual image of the selected Style Preset (Image #3). We tell the AI: *"Use this image as the ground truth for mood/lighting."*
*   **Logo:** We attach the Brand Logo (Image #1) and say: *"Integrate naturally."*
*   **Product:** We attach the Product Image (Image #2) and say: *"Focus on this."*

### 3. The Task (Freedom)
We give a simple, empowering instruction.
```text
TASK:
Create a stunning, cohesive visual that brings the User Idea to life.
If the user asks for specific text, make it the visual hero.
Otherwise, prioritize visual impact and brand vibe.
```

## Why this works
*   **No "Telephone" Game:** The AI sees the Style image directly. It doesn't need us to describe "Neon" in words.
*   **Less Hallucination:** By reducing the rule count, the AI focuses its attention on the *Images* provided.
*   **Better Art:** The results are less stiff and more "designed."

## Configuration
The prompt structure is currently **Hardcoded** in `api/generate-image.ts` to ensure consistency with the image attachment logic.
Future versions may allow Admin overrides for the "Task" section via the database.
