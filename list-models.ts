import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("❌ No API Key found");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("API Error:", data.error);
      return;
    }

    console.log("=== AVAILABLE MODELS ===");
    const models = data.models || [];
    
    // Filter for image or gemini models
    models.forEach((m: any) => {
      console.log(`ID: ${m.name}`);
      console.log(`   Display: ${m.displayName}`);
      console.log(`   Methods: ${m.supportedGenerationMethods?.join(', ')}`);
      console.log("---");
    });

    // Check specifically for the one we want
    const hasGemini3 = models.find((m: any) => m.name.includes('gemini-3'));
    if (hasGemini3) {
        console.log("✅ GEMINI 3 FOUND!");
    } else {
        console.log("⚠️ Gemini 3 NOT found in this list.");
    }

  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

listModels();
