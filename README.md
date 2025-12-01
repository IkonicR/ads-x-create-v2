<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Ads x Create V2 (AI Studio)

The world's best AI Ad Creator. Empowering business owners to generate agency-grade marketing assets instantly using Google Gemini 3 and Vercel AI SDK.

View your app: [https://ads-x-create-v2.vercel.app](https://ads-x-create-v2.vercel.app)

## Tech Stack
*   **Frontend:** React 19, Vite, Tailwind v4
*   **Backend:** Supabase (BaaS)
*   **AI:** Google Gemini 3 Pro (Client-side Direct)
*   **Database:** Supabase

## Run Locally

**Prerequisites:** Node.js, Vercel CLI

1.  **Install dependencies:**
    ```bash
    npm install
    npm install -g vercel
    ```

2.  **Link Vercel Project:**
    ```bash
    npx vercel link
    ```
    (Follow the prompts to link to `ads-x-create-v2`)

3.  **Pull Environment Variables:**
    ```bash
    npx vercel env pull .env.local
    ```

4.  **Run the App:**
    ```bash
    npx vercel dev
    ```
    *Note: Do not use `npm run dev` as it will not start the backend API functions.*

## Deployment

Deployments are automatic via Git push to `main`.

To deploy manually:
```bash
npx vercel deploy --prod
```