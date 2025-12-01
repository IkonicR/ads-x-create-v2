
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Allow large images

// Prevent EIO errors (Standard Input conflict)
if (typeof process !== 'undefined' && process.stdin && process.stdin.destroy) {
    process.stdin.destroy();
}

// --- API ROUTE: Generate Text ---
app.post('/api/generate-text', async (req, res) => {
    console.log('[Server] Text Generation Request Received');
    try {
        const { messages, prompt, system, modelTier = 'standard' } = req.body;

        const modelName = modelTier === 'premium' ? 'gemini-1.5-pro' : 'gemini-2.0-flash';
        const model = google(modelName);

        const result = await generateText({
            model,
            messages: messages || [{ role: 'user', content: prompt }],
            system,
        });

        console.log('[Server] Text Generated Successfully');
        res.json({ text: result.text });

    } catch (error) {
        console.error('[Server] Text Gen Error:', error);
        res.status(500).json({ error: 'Failed to generate text' });
    }
});

// import generateImageHandler from './api/generate-image';

// --- API ROUTE: Generate Image (Adapter for Vercel Function) ---
// This ensures we run the EXACT same code (Brain -> Hand) locally as in production.
/*
app.post('/api/generate-image', async (req, res) => {
    console.log('[Server] Image Generation Request Received (Brain Mode)');
    
    try {
        // 1. Convert Express Request to Web Standard Request
        // We need to create a fake URL for the constructor
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        const webReq = new Request('http://localhost:3000/api/generate-image', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body)
        });

        // 2. Call the Vercel Function Handler
        // const webRes = await generateImageHandler(webReq);

        // 3. Convert Web Response back to Express Response
        // const data = await webRes.json();
        // res.status(webRes.status).json(data);

        res.status(501).json({ error: "Server-side generation temporarily disabled locally." });

    } catch (error) {
        console.error('[Server] Image Gen Adapter Error:', error);
        res.status(500).json({ error: 'Failed to execute image generation handler' });
    }
});
*/

// Start Server
app.listen(port, () => {
    console.log(`✅ Local API Server running at http://localhost:${port}`);
    console.log(`   - POST /api/generate-text`);
    console.log(`   - POST /api/generate-image`);
});
