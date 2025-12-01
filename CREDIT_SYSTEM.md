# Credit System & Billing Architecture

## Overview
The Ads x Create credit system uses a **Server-Authoritative, Atomic Deduction** model.
This ensures users are never charged for failed generations and prevents client-side tampering with credit balances.

## Pricing Tiers
| Model Tier | Cost (Credits) | Features |
| :--- | :--- | :--- |
| **Flash 2.5** | **10** | Fast, drafted quality. Good for iteration. |
| **Gemini Pro** | **40** | High fidelity, commercially viable. |
| **Ultra 4K** | **80** | Maximum resolution (4096px), print-ready. |

## Transaction Flow

### 1. Initiation (Frontend)
- **User** clicks "Generate".
- **Visual Check:** Client checks if `local_credits >= cost`. If not, blocks request.
- **Request:** Client sends generation request to `api/generate-image` with `Authorization` header (Supabase Token).
- **State:** UI enters `loading` state but **does not deduct credits yet**.

### 2. Verification (Backend)
- **Authentication:** Server verifies the Supabase Token.
- **Balance Check:** Server queries `businesses` table (row locked via RLS).
- **Validation:** If `db_credits < cost`, request is rejected (402 Payment Required).

### 3. Execution (Backend)
- **Generation:** Server calls Google Gemini API.
- **Failure Handling:** If Gemini fails or times out, the process aborts. **0 Credits are deducted.**
- **Success:** Gemini returns an image.

### 4. Deduction (Backend)
- **Atomic Update:** Server calls Postgres RPC `deduct_credits(business_id, amount)`.
- **Logic:** `UPDATE businesses SET credits = credits - amount WHERE id = ...`
- **Response:** Server returns `{ image: base64, credits: new_balance }`.

### 5. Synchronization (Frontend)
- **Receive:** Client receives the new credit balance from the server response.
- **Update:** Client updates the local state to match the server's truth.
- **Display:** User sees the image and the new credit count simultaneously.

## Security Mechanisms
1.  **RLS (Row Level Security):** Users can only access businesses they own.
2.  **Server-Side Authority:** `api/generate-image.ts` is the only actor allowed to calculate costs.
3.  **Atomic RPC:** `deduct_credits` SQL function prevents race conditions (e.g., double spending via parallel requests).
4.  **No Client Trust:** The `businessContext` passed from client is used for *content* (names/colors) but ignored for *billing* (credits/ID checks).

## Troubleshooting
- **"Insufficient Credits"**: The server sees a lower balance than your browser. Refresh the page to sync.
- **Image Generated but Credits Not Deducted**: A rare edge case where the database update failed after generation. Consider it a freebie.
- **Credits Deducted but No Image**: Should be impossible with this architecture (Deduction happens *after* success).

## Database Schema
- **Table:** `businesses`
- **Column:** `credits` (Integer, Default 0)
- **RPC Function:** `deduct_credits(p_business_id, p_amount)`
