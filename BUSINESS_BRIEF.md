# Business Brief & Cost Analysis

## Product Overview
**Ads x Create** is an AI-powered creative suite designed to solve "Marketing Schizophrenia" for small businesses. It acts as a "Digital Brand Director," ensuring consistency in visuals and copy across all marketing channels.

## AI Model Strategy & Costs (Verified 2025)

We utilize the **Google Gemini API** for intelligence and generation.

### 1. Image Generation (Gemini 3 Pro Image Preview)
**The Premium Engine.** Capable of strict style adherence, text rendering, and high fidelity.

**Pricing Model:** Token-Based (Output + Input).
*   **Output Cost:** $120.00 per 1,000,000 tokens.
*   **Input Cost:** $0.0011 per image (fixed 560 tokens) or text equivalent.

**Cost Breakdown per Generation:**
| Resolution | Tokens (Output) | Cost (Output) | Total Cost (Est) |
| :--- | :--- | :--- | :--- |
| **1024 x 1024 (Standard)** | ~1,120 | $0.134 | **~$0.14** |
| **2048 x 2048 (2K)** | ~1,120 | $0.134 | **~$0.14** |
| **4096 x 4096 (4K)** | ~2,000 | $0.240 | **~$0.25** |

*Note: We currently default to Standard/2K. 4K is available but costs ~80% more.*

**Reference Image Costs (Inputs):**
If a user attaches a Product Image or Style Reference:
*   **Cost:** 560 Tokens per image = **$0.0011** (negligible).
*   *Example:* 3 Reference images = $0.0033.

### 2. Fast Generation (Gemini 2.5 Flash Image)
**The Draft Engine.** Good for quick ideas or social posts where fidelity is less critical.

**Cost:**
*   **Flat Rate:** ~$0.039 per image (Standard resolution).

### 3. Text & Logic (Gemini 2.5 Flash)
**The Consultant.** Handles chat, prompt engineering, and tasks.

**Cost:**
*   **Input:** $0.075 / 1M tokens.
*   **Output:** $0.30 / 1M tokens.
*   *Reality:* A massive chat history (10k tokens) costs $0.003. Effectively free.

---

## Margin & Credit System (DEFINITIVE)
To ensure profitability, the internal "Credit" system operates on a High Margin model.

*   **1 Credit** ≈ $0.02 Cost Basis.

### Pricing Strategy

| Action | Engine | Credit Cost | Value ($) | Margin |
| :--- | :--- | :--- | :--- | :--- |
| **Premium Gen** | Gemini 3 Pro | **40 Credits** | $0.80 | **~83%** |
| **4K Upgrade** | Gemini 3 Pro | **80 Credits** | $1.60 | **~85%** |
| **Fast Gen** | Gemini Flash | **10 Credits** | $0.20 | **~80%** |
| **Chat/Text** | Gemini Flash | **Free** | $0.00 | N/A |

## Technical Constraints
*   **Rate Limits:** 
    *   Gemini 3 Pro Image: Check quota (usually lower RPM than text).
*   **Safety:** 
    *   Strict safety filters are active.
    *   *Handling:* Failed generations due to safety do NOT consume credits (logic to be implemented).