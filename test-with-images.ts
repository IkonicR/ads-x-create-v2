// Test Direct Google API with images to replicate server conditions
import { GoogleGenAI } from '@google/genai';

const TEST_PROMPT = "Create a simple promotional image for a coffee shop. Include the text 'Fresh Coffee Daily'.";
const LOGO_URL = "https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/logo/1763936990810.png";
const STYLE_REF_URL = "https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/system/styles/1764577393689_qh83bd.webp";

async function urlToBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
    } catch (e) {
        console.error("Failed to fetch:", e);
        return null;
    }
}

async function testWithoutImages() {
    console.log('\n=== TEST 1: NO IMAGES (Simple) ===');
    const startTime = Date.now();

    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: TEST_PROMPT,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            } as any,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ No images: ${elapsed}s`);
        return parseFloat(elapsed);
    } catch (error: any) {
        console.log(`❌ Failed: ${error.message}`);
        return -1;
    }
}

async function testWithImageConfig() {
    console.log('\n=== TEST 2: WITH imageConfig (aspectRatio + imageSize) ===');
    const startTime = Date.now();

    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: TEST_PROMPT,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: '9:16',
                    imageSize: '2K',
                },
            } as any,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ With imageConfig: ${elapsed}s`);
        return parseFloat(elapsed);
    } catch (error: any) {
        console.log(`❌ Failed: ${error.message}`);
        return -1;
    }
}

async function testWithOneImage() {
    console.log('\n=== TEST 3: WITH 1 IMAGE (Logo) ===');

    console.log('Fetching logo...');
    const logoBase64 = await urlToBase64(LOGO_URL);
    if (!logoBase64) {
        console.log('Failed to fetch logo');
        return -1;
    }
    console.log('Logo size:', Math.round(logoBase64.length / 1024), 'KB');

    const startTime = Date.now();
    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{
                role: 'user',
                parts: [
                    { text: TEST_PROMPT },
                    { inlineData: { mimeType: 'image/png', data: logoBase64 } },
                    { text: ' [LOGO IMAGE] ' }
                ]
            }],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: '9:16',
                    imageSize: '2K',
                },
            } as any,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ With 1 image: ${elapsed}s`);
        return parseFloat(elapsed);
    } catch (error: any) {
        console.log(`❌ Failed: ${error.message}`);
        return -1;
    }
}

async function testWithFiveImages() {
    console.log('\n=== TEST 4: WITH 5 IMAGES (Like Production) ===');

    console.log('Fetching images...');
    const logoBase64 = await urlToBase64(LOGO_URL);
    const style1 = await urlToBase64("https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/system/styles/1764577393689_qh83bd.webp");
    const style2 = await urlToBase64("https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/system/styles/1764579996882_dle6jb.jpeg");
    const style3 = await urlToBase64("https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/system/styles/1764577395436_yji7eg.webp");
    const style4 = await urlToBase64("https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/system/styles/1764577394410_9v6xk.webp");

    if (!logoBase64 || !style1 || !style2 || !style3 || !style4) {
        console.log('Failed to fetch some images');
        return -1;
    }

    console.log('Total payload size:', Math.round((logoBase64.length + style1.length + style2.length + style3.length + style4.length) / 1024), 'KB');

    const startTime = Date.now();
    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{
                role: 'user',
                parts: [
                    { text: TEST_PROMPT },
                    { inlineData: { mimeType: 'image/png', data: logoBase64 } },
                    { text: ' [LOGO] ' },
                    { inlineData: { mimeType: 'image/webp', data: style1 } },
                    { text: ' [STYLE 1] ' },
                    { inlineData: { mimeType: 'image/jpeg', data: style2 } },
                    { text: ' [STYLE 2] ' },
                    { inlineData: { mimeType: 'image/webp', data: style3 } },
                    { text: ' [STYLE 3] ' },
                    { inlineData: { mimeType: 'image/webp', data: style4 } },
                    { text: ' [STYLE 4] ' },
                ]
            }],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: '9:16',
                    imageSize: '2K',
                },
            } as any,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ With 5 images: ${elapsed}s`);
        return parseFloat(elapsed);
    } catch (error: any) {
        console.log(`❌ Failed: ${error.message}`);
        return -1;
    }
}

async function main() {
    console.log('🔬 COMPREHENSIVE PERFORMANCE TEST');
    console.log('API Key present:', !!process.env.GOOGLE_API_KEY);

    const t1 = await testWithoutImages();
    const t2 = await testWithImageConfig();
    const t3 = await testWithOneImage();
    const t4 = await testWithFiveImages();

    console.log('\n=== RESULTS ===');
    console.log(`No images: ${t1}s`);
    console.log(`With imageConfig only: ${t2}s`);
    console.log(`With 1 image: ${t3}s`);
    console.log(`With 5 images: ${t4}s`);
}

main().catch(console.error);
