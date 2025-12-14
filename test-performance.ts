// Performance comparison test: Direct Google vs Vercel Gateway
import { GoogleGenAI } from '@google/genai';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

const TEST_PROMPT = "Generate a simple promotional image for a coffee shop. Include the text 'Fresh Coffee Daily' and warm colors.";

async function testDirectGoogle() {
  console.log('\n=== TEST 1: DIRECT GOOGLE API ===');
  const startTime = Date.now();

  const client = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: TEST_PROMPT,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Direct Google API took: ${elapsed}s`);
    console.log('Response received:', response.candidates?.[0]?.content?.parts?.length, 'parts');
    return parseFloat(elapsed);
  } catch (error: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ Direct Google API failed after ${elapsed}s:`, error.message);
    return -1;
  }
}

async function testVercelGateway() {
  console.log('\n=== TEST 2: VERCEL AI GATEWAY ===');
  const startTime = Date.now();

  try {
    const result = await generateText({
      model: gateway('google/gemini-3-pro-image'),
      messages: [{
        role: 'user',
        content: TEST_PROMPT
      }],
      providerOptions: {
        google: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Vercel Gateway took: ${elapsed}s`);
    console.log('Response files:', result.files?.length || 0);
    return parseFloat(elapsed);
  } catch (error: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ Vercel Gateway failed after ${elapsed}s:`, error.message);
    return -1;
  }
}

async function main() {
  console.log('🔬 PERFORMANCE COMPARISON TEST');
  console.log('Prompt:', TEST_PROMPT.substring(0, 50) + '...');
  console.log('API Key present:', !!process.env.VITE_GEMINI_API_KEY);
  console.log('Gateway Key present:', !!process.env.AI_GATEWAY_API_KEY);

  const directTime = await testDirectGoogle();
  const gatewayTime = await testVercelGateway();

  console.log('\n=== RESULTS ===');
  console.log(`Direct Google: ${directTime}s`);
  console.log(`Vercel Gateway: ${gatewayTime}s`);
  if (directTime > 0 && gatewayTime > 0) {
    const diff = gatewayTime - directTime;
    console.log(`Difference: ${diff.toFixed(2)}s (Gateway is ${(diff / directTime * 100).toFixed(1)}% slower)`);
  }
}

main().catch(console.error);
