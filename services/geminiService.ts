import { GoogleGenAI, GenerateContentResponse, Chat, FunctionDeclaration, Type, Part } from "@google/genai";
import { Business, StylePreset, GenerationStrategy, Task } from '../types';
import { PromptFactory } from './prompts';
import { getSymbolFromCurrency } from '../utils/currency';
import { supabase } from './supabase';
import { AI_MODELS } from '../config/ai-models';
import { StorageService } from './storage';

/**
 * Clean function call artifacts from AI text output.
 * The model sometimes outputs f{generate_marketing_image(...)} as plain text
 * instead of making an actual function call. This removes those artifacts.
 */
const cleanFunctionCallArtifacts = (text: string): string => {
  // Pattern explanation:
  // - f?\{ matches optional 'f' followed by '{'
  // - generate_marketing_image\( matches the function name
  // - [\s\S]*? matches any content (including newlines) non-greedy
  // - \)\} matches closing ')}'
  return text
    .replace(/f?\{generate_marketing_image\([\s\S]*?\)\}/g, '')
    // Catch ANY function call syntax (both prompt= and prompt: variants)
    .replace(/generate_marketing_image\s*\([^)]*\)/g, '')
    // Clean up malformed function call JSON (when AI outputs as text instead of structured)
    .replace(/calls"?\s*:\s*\[[\s\S]*?generate_marketing_image[\s\S]*?\]/g, '')
    .replace(/function"?\s*:\s*"?generate_marketing_image[\s\S]*?\}/g, '')
    // Clean up orphaned JSON fragments that sometimes leak through
    .replace(/"?\s*args"?\s*:\s*\{[^}]*\}/g, '')  // Catches "args": {...}
    // Clean internal AI notes and comments
    .replace(/\/\/\s*Note:.*$/gm, '')  // Catches "// Note: ..."
    .replace(/\/\/\s*Calling the tool.*$/gm, '')  // Catches "// Calling the tool..."
    .replace(/\/\/\s*I will.*$/gm, '')  // Catches "// I will generate..."
    .replace(/^\/\/.*$/gm, '')  // Catches any remaining // comments
    // Clean thought artifacts
    .replace(/"thought"\s*:\s*"[^"]*"/g, '')  // Catches "thought": "..."
    // Clean orphaned JSON syntax
    .replace(/"\s*\}/g, '')  // Catches " }
    .replace(/\{\s*"/g, '')  // Catches { "
    .replace(/"\s*,?\s*$/gm, '')  // Catches trailing " or ", at end of lines
    .replace(/^\s*\}\s*$/gm, '')  // Catches lines that are just }
    .replace(/^\s*\[\s*$/gm, '')  // Catches lines that are just [
    .replace(/^\s*\]\s*$/gm, '')  // Catches lines that are just ]
    .replace(/\n{3,}/g, '\n\n')  // Collapse 3+ newlines to 2
    .trim();
};

/**
 * Detect and trim infinite repetition loops in AI output.
 * If a 50+ character block repeats 3+ times consecutively, 
 * truncate at the end of the first occurrence.
 * This is a circuit breaker for model degeneration loops.
 */
const detectAndTrimRepetitions = (text: string): string => {
  // Look for any 50+ char block that repeats 3+ times consecutively
  const pattern = /(.{50,}?)\1{2,}/g;
  const match = pattern.exec(text);

  if (match) {
    console.warn('[GeminiService] ⚠️ Repetition loop detected, truncating output');
    // Return text up to and including first occurrence of the repeated block
    return text.slice(0, match.index + match[1].length).trim();
  }

  return text;
};

interface ParsedFunctionCall {
  prompt: string;
  styleId?: string;
  aspectRatio?: string;
  modelTier?: 'pro' | 'ultra';
}

/**
 * Parse f{generate_marketing_image(...)} from text when SDK doesn't detect function calls.
 * Returns an array of parsed function call parameters.
 */
const parseTextFunctionCalls = (text: string): ParsedFunctionCall[] => {
  const calls: ParsedFunctionCall[] = [];

  // Match all f{generate_marketing_image(...)} patterns
  const pattern = /f?\{generate_marketing_image\(([\s\S]*?)\)\}/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const argsStr = match[1];

    // Extract prompt="..."
    const promptMatch = argsStr.match(/prompt\s*=\s*"([^"]+)"/);
    if (!promptMatch) continue;

    const parsed: ParsedFunctionCall = {
      prompt: promptMatch[1]
    };

    // Extract optional parameters
    const styleIdMatch = argsStr.match(/styleId\s*=\s*"([^"]+)"/);
    if (styleIdMatch) parsed.styleId = styleIdMatch[1];

    const aspectRatioMatch = argsStr.match(/aspectRatio\s*=\s*"([^"]+)"/);
    if (aspectRatioMatch) parsed.aspectRatio = aspectRatioMatch[1];

    const modelTierMatch = argsStr.match(/modelTier\s*=\s*"(pro|ultra)"/);
    if (modelTierMatch) parsed.modelTier = modelTierMatch[1] as 'pro' | 'ultra';

    calls.push(parsed);
  }

  return calls;
};

// Helper to get the client.
const getAiClient = () => {
  // Fallback for VITE_ prefix or standard
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') return null;
  return new GoogleGenAI({ apiKey });
};

// Helper: Fetch image from URL and convert to Base64
const urlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to fetch image for context:", e);
    return null;
  }
};

export const generateAdCopy = async (
  businessName: string,
  productName: string,
  tone: string,
  keywords: string[]
): Promise<string> => {
  const ai = getAiClient();

  if (!ai) {
    return `(Simulated) Magic copy for ${productName} by ${businessName}.`;
  }

  try {
    const model = AI_MODELS.textDirect;
    const prompt = `
      Write a short, punchy ad copy for a business named "${businessName}".
      Product: "${productName}".
      Tone: "${tone}".
      Keywords to include: ${keywords.join(', ')}.
      Keep it under 200 characters.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Could not generate text.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content.";
  }
};

// NOTE: generateTaskSuggestions was removed - Tasks page now uses manual task management.
// AI task suggestions are handled by the Chat CMO assistant if needed.

/**
 * Generate a concise chat title from conversation messages
 * Accepts single message or array of messages for progressive refinement
 */
export const generateChatTitle = async (messages: string | string[]): Promise<string> => {
  const ai = getAiClient();
  const messageArray = Array.isArray(messages) ? messages : [messages];
  const fallback = messageArray[0]?.slice(0, 40) || 'New Chat';

  if (!ai) return fallback;

  try {
    const isRefinement = messageArray.length > 1;
    const contextText = messageArray.slice(-5).join('\n---\n').slice(0, 500);

    const prompt = isRefinement
      ? `Based on this conversation, generate a concise 3-6 word title that captures the main topic. Be specific and descriptive. No quotes or punctuation at the end.

Conversation:
${contextText}

Title:`
      : `Generate a concise 3-6 word title for this chat request. Be descriptive but brief. No quotes or punctuation at the end.

User message: "${messageArray[0]?.slice(0, 200)}"

Title:`;

    const response = await ai.models.generateContent({
      model: AI_MODELS.textDirect,
      contents: prompt,
    });

    const title = response.text?.trim().replace(/^["']|["']$/g, '').slice(0, 60);
    return title || fallback;
  } catch {
    return fallback;
  }
};

export const generateImage = async (
  prompt: string,
  business: Business,
  stylePreset?: StylePreset,
  subjectContext?: {
    type: string;
    name?: string;
    imageUrl: string;
    preserveLikeness: boolean;
    promotion?: string;
    benefits?: string[];
    targetAudience?: string;
    price?: string;
  },
  aspectRatio: string = "1:1",
  modelTier: 'flash' | 'pro' | 'ultra' = 'pro',
  strategy?: GenerationStrategy,
  thinkingMode?: 'LOW' | 'HIGH',
  isFreedomMode?: boolean // NEW: Freedom Mode flag
): Promise<{ jobId: string; status: string }> => {
  console.log(`[GeminiService] Initializing generation for business: ${business.id}`, { prompt, modelTier, aspectRatio, isFreedomMode });

  // Call the server-side API instead of generating client-side
  // This enables job persistence across page refreshes
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: business.id,
      prompt,
      aspectRatio,
      styleId: stylePreset?.id,
      subjectId: subjectContext ? undefined : undefined, // Will be passed via subjectContext
      modelTier,
      thinkingMode,
      strategy,
      subjectContext,
      stylePreset,
      isFreedomMode // NEW: Pass freedom mode to server
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
    console.error(`[GeminiService] \u274C API Error:`, errorData);
    throw new Error(errorData.error || 'Generation failed');
  }

  const data = await response.json();
  console.log(`[GeminiService] \u2705 Generation job created:`, data.jobId);
  return data;
};

// Poll for job completion
export const pollJobStatus = async (jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  asset?: any;
  errorMessage?: string;
}> => {
  const response = await fetch(`/api/generate-image/status/${jobId}`);
  if (!response.ok) {
    console.error(`[GeminiService] Status poll failed for job: ${jobId}`);
    throw new Error('Failed to fetch job status');
  }
  const data = await response.json();
  return data;
};

// Get pending jobs for a business (for page load recovery)
export const getPendingJobs = async (businessId: string): Promise<any[]> => {
  const response = await fetch(`/api/generate-image/pending/${businessId}`);
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.jobs || [];
};

// killJob - forcefully remove a stuck job
export const killJob = async (jobId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/generate-image/job/${jobId}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('[GeminiService] Failed to kill job:', error);
    return false;
  }
};


export const enhanceOffering = async (
  name: string,
  price: string,
  category: string,
  description: string
): Promise<{ description: string, targetAudience: string, benefits: string[], features: string[], promotion: string }> => {

  const ai = getAiClient();
  if (!ai) throw new Error("No API Key");

  const prompt = `
    You are a masterful marketing copywriter.
    Enhance the product strategy for: "${name}" (${category}).
    Price: ${price}.
    Current Description: "${description}".

    Output a valid JSON object with these fields:
    {
      "description": "A compelling, persuasive description (max 2 sentences)",
      "targetAudience": "The ideal buyer persona",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "promotion": "A catchy, realistic promotion idea (e.g. 'Limited Time 20% Off')"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODELS.textDirect,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      description: description,
      targetAudience: "General Public",
      benefits: ["High Quality", "Great Value"],
      features: ["Premium Materials"],
      promotion: "New Arrival"
    };
  }
}

// CHAT SERVICE WITH TOOLS
export const sendChatMessage = async (
  business: Business,
  history: { role: 'user' | 'ai'; text: string; imageUrl?: string }[],
  newMessage: string,
  creativeContext: {
    subject: { id: string; name: string; type: 'product' | 'person'; imageUrl?: string } | null;
    isFreedomMode: boolean;
    overrides: { tone?: string; audience?: string };
  } = { subject: null, isFreedomMode: false, overrides: {} },
  recentImageUrl?: string
): Promise<{
  text: string;
  image?: string;
  jobId?: string;
  jobIds?: string[];
  generationMeta?: {
    total: number;
    aspectRatio?: string;
    styleName?: string;
    descriptions?: string[];
    aspectRatios?: string[];
    styleNames?: string[];
  };
}> => {
  const ai = getAiClient();

  if (!ai) {
    return { text: "Please select an API key to start chatting." };
  }

  try {
    // Fetch available styles for AI context (Phase 2)
    const { data: stylesData } = await supabase
      .from('styles')
      .select('id, name, description')
      .limit(15);

    const availableStyles = stylesData || [];

    // Fetch Active Tasks for AI context (Phase 9: Task Awareness)
    // Include full details so CMO knows dimensions, specs, and descriptions
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id, title, status, priority, description, dueDate:due_date, category, techSpecs:tech_specs')
      .eq('business_id', business.id)
      .neq('status', 'Done')
      .limit(10);

    const activeTasks = tasksData || [];

    // Inject Context Overrides into System Instruction
    const businessWithOverrides = {
      ...business,
      voice: {
        ...business.voice,
        tone: creativeContext.overrides.tone || business.voice?.tone
      },
      adPreferences: {
        ...business.adPreferences,
        targetAudience: creativeContext.overrides.audience || business.adPreferences?.targetAudience
      }
    };

    const systemInstruction = await PromptFactory.createChatSystemInstruction(
      businessWithOverrides,
      availableStyles,
      activeTasks
    );

    const imageGenTool: FunctionDeclaration = {
      name: 'generate_marketing_image',
      description: 'Production Engine. Use ONLY when user explicitly confirms a visual pitch or asks to create/generate. Do not use for brainstorming. Parameters: prompt (required), styleId, aspectRatio, modelTier, isEdit, isFreedomMode, offeringId.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          prompt: {
            type: Type.STRING,
            description: 'Detailed visual description of the ad image to generate.',
          },
          styleId: {
            type: Type.STRING,
            description: 'Optional. The style preset ID. If the user mentions a style name, match it to an ID. Otherwise omit.',
          },
          aspectRatio: {
            type: Type.STRING,
            description: 'Optional. Format options: "1:1" (square/Instagram), "9:16" (story/reel/TikTok), "16:9" (wide/YouTube), "4:5" (IG feed). Default: 1:1',
          },
          modelTier: {
            type: Type.STRING,
            description: 'Optional. "pro" for standard quality (1 credit), "ultra" for 4K print-ready (2 credits). Default: pro',
          },
          isEdit: {
            type: Type.BOOLEAN,
            description: 'Set to true if this is an edit of a previous image in the conversation.',
          },
          isFreedomMode: {
            type: Type.BOOLEAN,
            description: 'Set to true for creative exploration, abstract concepts, or unusual style requests that go beyond standard brand-adherent ads. Use when user wants you to "be creative", "surprise me", or asks for experimental/artistic visuals.',
          },
          offeringId: {
            type: Type.STRING,
            description: 'Optional. The ID of the product/offering to feature. Use when generating for a specific product - its actual image will be included as reference.',
          },
        },
        required: ['prompt'],
      },
    };

    // Prepare Context for the AI
    let contextMessage = newMessage;
    let imageGenContext: any = undefined;

    if (creativeContext.subject) {
      contextMessage += `\n\n[User attached context: ${creativeContext.subject.type.toUpperCase()} - ${creativeContext.subject.name}]`;

      // Hydrate context for image generation
      imageGenContext = {
        type: creativeContext.subject.type,
        imageUrl: creativeContext.subject.imageUrl || '',
        preserveLikeness: creativeContext.subject.type === 'person', // Default strict for people
      };

      // If Product, try to find details
      if (creativeContext.subject.type === 'product') {
        const offering = business.offerings.find(o => o.id === creativeContext.subject!.id);
        if (offering) {
          imageGenContext.promotion = offering.promotion;
          imageGenContext.benefits = offering.benefits;
          imageGenContext.targetAudience = offering.targetAudience;
          imageGenContext.preserveLikeness = offering.preserveLikeness;
        }
      }
    }

    if (creativeContext.isFreedomMode) {
      contextMessage += `\n\n[MODE: CREATIVE FREEDOM ON]`;
    }

    // Build multimodal history
    const multimodalHistory = await Promise.all(history.map(async h => {
      const parts: Part[] = [{ text: h.text }];

      // If this message has an associated image, include it
      if (h.imageUrl) {
        try {
          const imageBase64 = await urlToBase64(h.imageUrl);
          if (imageBase64) {
            parts.push({
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64
              }
            });
          }
        } catch (e) {
          console.warn('Failed to load image for history:', e);
        }
      }

      return {
        role: h.role === 'ai' ? 'model' : 'user',
        parts
      };
    }));

    // If there's a recent image context, add it to current message
    let messageParts: Part[] = [{ text: contextMessage }];
    if (recentImageUrl) {
      const imageBase64 = await urlToBase64(recentImageUrl);
      if (imageBase64) {
        messageParts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64
          }
        });
      }
    }

    // =========================================================================
    // TWO-TURN CONVERSATION PATTERN
    // Turn 1: Get conversational response (NO tools, NO tool instructions)
    // Turn 2: Execute generation (WITH tools, full CMO prompt)
    // =========================================================================

    // TURN 1: Conversational response (Rich Context, No Tools)
    const textChat = ai.chats.create({
      model: AI_MODELS.textDirect,
      config: {
        systemInstruction: systemInstruction, // Use the FULL context (Tasks, Products, etc)
        tools: [],  // No tools allowed in Turn 1
      },
      history: multimodalHistory
    });

    // @ts-ignore
    const textResponse = await textChat.sendMessage({
      message: messageParts
    });

    // Clean any accidental JSON/function syntax from Turn 1
    let conversationalText = textResponse.text || '';

    // Safety: Check for infinite loops (Circuit Breaker)
    conversationalText = detectAndTrimRepetitions(conversationalText);

    conversationalText = conversationalText
      .replace(/\{[\s\S]*?"action"[\s\S]*?\}/g, '')  // LangChain JSON
      .replace(/f?\{generate_marketing_image[\s\S]*?\}/g, '')  // f{} syntax
      .replace(/generate_marketing_image\s*\([^)]*\)/g, '')  // Any function call syntax
      .replace(/\{\s*"prompt"[\s\S]*?\}/g, '')  // Raw JSON
      .replace(/\/\/\s*Note:.*$/gm, '')  // Internal notes
      .replace(/\/\/\s*Calling the tool.*$/gm, '')  // Tool call comments
      .replace(/^\/\/.*$/gm, '')  // Any remaining // comments
      .replace(/"thought"\s*:\s*"[^"]*"/g, '')  // Thought artifacts
      .trim();

    // TURN 2: Action execution (with full CMO prompt and tools)
    // Let the AI decide via native function calling whether to generate
    const actionChat = ai.chats.create({
      model: AI_MODELS.textDirect,
      config: {
        systemInstruction: systemInstruction,  // Full CMO prompt with tool instructions
        tools: [{ functionDeclarations: [imageGenTool] }],
      },
      history: [
        ...multimodalHistory,
        { role: 'user', parts: messageParts },
        { role: 'model', parts: [{ text: conversationalText }] }
      ]
    });

    // Ask AI to decide if generation is needed based on conversation
    // @ts-ignore 
    const actionResponse = await actionChat.sendMessage({
      message: [{
        text: `### EXECUTION GATE (STRICT MODE)

Review the Assistant's LAST response. Did it EXPLICITLY COMMIT to generating images RIGHT NOW?

**GENERATE** if the Assistant said phrases like:
- "Generating now", "Creating now", "On it"
- "Here they come", "Whipping up X concepts"
- "Generating X variations for you"

**DO NOT GENERATE** if the Assistant:
- Described ideas or concepts (e.g., "I'm envisioning...", "Here are two directions...")
- Asked a question (e.g., "Which one?", "Want me to generate?", "Say the word")
- Proposed options without committing (e.g., "We could do X or Y")

If in doubt: **DO NOT GENERATE**. Respond with "NO_ACTION".

The user said they wanted pitches first. Respect that.` }]
    });

    // ========== DIAGNOSTIC LOGGING (Function Call Debug) ==========
    console.log('[GeminiService] 🔍 FUNCTION CALL DIAGNOSTICS:');
    console.log('  → Response type:', typeof actionResponse);
    console.log('  → Has candidates:', !!actionResponse.candidates);
    console.log('  → Candidates length:', actionResponse.candidates?.length);

    const candidate = actionResponse.candidates?.[0];
    console.log('  → Candidate[0] exists:', !!candidate);
    console.log('  → Content exists:', !!candidate?.content);
    console.log('  → Parts exists:', !!candidate?.content?.parts);
    console.log('  → Parts length:', candidate?.content?.parts?.length);

    // Log each part to see what we're getting
    candidate?.content?.parts?.forEach((p: any, i: number) => {
      console.log(`  → Part[${i}]:`, {
        hasText: !!p.text,
        textPreview: p.text?.slice(0, 100),
        hasFunctionCall: !!p.functionCall,
        functionCallName: p.functionCall?.name,
        functionCallArgs: p.functionCall?.args ? Object.keys(p.functionCall.args) : null
      });
    });

    // Check if there's text that LOOKS like a function call (the failing case)
    const allText = candidate?.content?.parts?.filter((p: any) => p.text).map((p: any) => p.text).join('') || '';
    if (allText.includes('generate_marketing_image') || allText.includes('f{')) {
      console.log('  ⚠️ WARNING: Text contains function-call-like syntax but no structured functionCall detected!');
      console.log('  → Raw text:', allText.slice(0, 500));
    }
    // ========== END DIAGNOSTIC LOGGING ==========

    const functionCalls = actionResponse.candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall) || [];
    console.log('[GeminiService] 📊 Extracted functionCalls:', functionCalls.length, functionCalls.map(c => c?.name));

    if (functionCalls && functionCalls.length > 0) {
      // Phase 5: Filter for all image generation calls
      const imageGenCalls = functionCalls.filter(c => c?.name === 'generate_marketing_image');

      if (imageGenCalls.length > 0) {
        const jobIds: string[] = [];
        const descriptions: string[] = [];
        const aspectRatios: string[] = [];
        const styleNames: string[] = [];

        // Process ALL image generation calls (not just the first)
        for (const call of imageGenCalls) {
          // @ts-ignore - Extract all parameters from function call
          const imagePrompt = call.args['prompt'] as string;
          const styleId = call.args['styleId'] as string | undefined;
          const aspectRatio = (call.args['aspectRatio'] as string) || '1:1';
          const modelTier = (call.args['modelTier'] as 'pro' | 'ultra') || 'pro';
          const offeringId = call.args['offeringId'] as string | undefined;
          // AI-triggered Freedom Mode (OR fallback to manual toggle)
          const aiFreedomMode = call.args['isFreedomMode'] as boolean | undefined;
          const effectiveFreedomMode = aiFreedomMode ?? creativeContext.isFreedomMode;

          // Build subjectContext from offering if AI specified one
          let effectiveContext = imageGenContext;
          if (offeringId) {
            const offering = business.offerings.find(o => o.id === offeringId);
            if (offering && offering.imageUrl) {
              console.log(`[GeminiService] 📦 Product context injected: ${offering.name} (ID: ${offeringId})`);
              effectiveContext = {
                type: 'product',
                name: offering.name,
                imageUrl: offering.imageUrl,
                preserveLikeness: offering.preserveLikeness ?? false,
                promotion: offering.promotion,
                benefits: offering.benefits,
                targetAudience: offering.targetAudience,
                price: offering.price,
              };
            } else if (offering) {
              console.log(`[GeminiService] ⚠️ Offering "${offering.name}" has no image - using logo only`);
            } else {
              console.warn(`[GeminiService] ⚠️ Offering ID not found: ${offeringId}`);
            }
          }

          // Fetch style preset if AI specified one
          let stylePreset: StylePreset | undefined;
          if (styleId) {
            const { data } = await supabase
              .from('styles')
              .select('*')
              .eq('id', styleId)
              .single();
            if (data) stylePreset = data as StylePreset;
          }

          // Use the job-based generateImage with AI-selected parameters
          const { jobId } = await generateImage(
            imagePrompt,
            business,
            stylePreset,
            effectiveContext, // Use offering context if available, else fallback
            aspectRatio,
            modelTier,
            undefined,
            undefined,
            effectiveFreedomMode // AI can trigger or user toggle
          );

          jobIds.push(jobId);
          descriptions.push(stylePreset?.name || `${aspectRatio} image`);
          aspectRatios.push(aspectRatio);
          styleNames.push(stylePreset?.name || '');
        }

        // Build response based on single vs multiple images
        const isBatch = jobIds.length > 1;

        // Return with Turn 1's conversational text + generation jobs
        // Provide fallback if text is empty after cleanup
        const finalText = cleanFunctionCallArtifacts(conversationalText).trim();
        const displayText = finalText || (jobIds.length > 1
          ? `On it! Creating ${jobIds.length} variations for you...`
          : 'On it! Generating your asset now...');

        return {
          text: displayText,
          image: undefined,
          jobId: isBatch ? undefined : jobIds[0],
          jobIds: isBatch ? jobIds : undefined,
          generationMeta: {
            total: jobIds.length,
            descriptions,
            aspectRatios,
            styleNames,
            aspectRatio: aspectRatios[0] || '1:1',
            styleName: styleNames.find(s => s) || undefined
          }
        };
      }
    }

    // No function calls - return just the conversational text from Turn 1
    return {
      text: conversationalText,
      image: undefined
    };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I'm having trouble connecting to the creative server." };
  }
};