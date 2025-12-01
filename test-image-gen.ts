import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGen() {
  console.log("Testing Gemini Image Gen via generateText...");

  try {
    // NOTE: Testing confirmed ID: gemini-3-pro-image-preview
    const modelName = 'gemini-3-pro-image-preview'; 
    console.log(`Model: ${modelName}`);

    const result = await generateText({
      model: google(modelName),
      prompt: "A futuristic red sports car, neon lights, cinematic lighting",
    });

    console.log("✅ Text generated.");
    console.log("Result keys:", Object.keys(result));

    // Check for experimental 'files' or similar
    // @ts-ignore
    const files = result.files || [];
    console.log("Files found:", files.length);

    if (files.length > 0) {
        console.log("First file media type:", files[0].mediaType);
        // console.log("First file data length:", files[0].data.length);
    } else {
        console.log("❌ No images found in response.");
        console.log("Full Text Response:", result.text);
    }

  } catch (error) {
    console.error("❌ FAILED:");
    console.error(error);
  }
}

testGen();