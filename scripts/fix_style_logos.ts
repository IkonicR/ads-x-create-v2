
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * FIX: The previous configs had logos set to "Subtle Watermark" or passive integration,
 * which caused the AI to NOT render the logo prominently.
 * 
 * Solution: Make brandApplication ASSERTIVE - tell the AI to RENDER the logo clearly.
 */

const fixes = [
    {
        name: "Nostalgia Royale",
        id: "66f58de4-5839-4ac8-bc32-c86c0962545d",
        // PROBLEM: "Subtle Watermark" + "Overprint / Multiply Mode" = logo invisible
        // FIX: Brand as a bold screenprinted element, central and visible
        config: {
            "schemaVersion": "3.0",
            "mediumController": {
                "medium": "Digital Illustration",
                "executionDetails": {
                    "style": "Mid-Century Modern Flat",
                    "technique": "Screenprint Simulation",
                    "brushwork": "Stippled Shading",
                    "vectorStyle": "Geometric Simplification",
                    "complexity": "Simple shapes"
                }
            },
            "viewpoint": {
                "shotType": "Wide Composition",
                "angle": "Eye-Level",
                "perspective": "Flat / 2D Layering",
                "depthOfField": "Infinite (Everything in Focus)",
                "framingRule": "Rule of Thirds"
            },
            "lighting": {
                "style": "Flat Illustration",
                "quality": "No Cast Shadows",
                "contrast": "Moderate",
                "temperature": "Warm Vintage",
                "atmospherics": "Paper Texture"
            },
            "aesthetics": {
                "colorGrade": "Vintage Kodak / Sepia Tones",
                "clarity": "Slight Blur / Softness",
                "textureOverlay": "Aged Paper / Dust",
                "primarySurfaceMaterial": "Matte Paper"
            },
            // ⬇️ FIXED: Logo is now a BOLD SCREENPRINTED ELEMENT, not a subtle watermark
            "brandApplication": {
                "integrationMethod": "Screenprinted Badge / Stamp",
                "materiality": "Bold Ink Block on Paper",
                "lightingInteraction": "Flat (Same as Illustration)",
                "prominence": "Prominent Focal Element"
            }
        }
    },
    {
        name: "Playful Line Art",
        id: "558c80e7-5a60-4b90-b8b4-400252a39e81",
        // PROBLEM: "Standard" prominence + "Line Art Integration" = vague
        // FIX: Logo as a clear monoline vector element, prominently placed
        config: {
            "schemaVersion": "3.0",
            "mediumController": {
                "medium": "Vector Art",
                "executionDetails": {
                    "style": "Corporate Memphis / Monoline",
                    "vectorStyle": "Round Cap Strokes",
                    "complexity": "Minimalist",
                    "technique": "Digital Vector",
                    "brushwork": "Solid Stroke"
                }
            },
            "viewpoint": {
                "shotType": "Iconic / Isolated",
                "angle": "Flat Frontal",
                "perspective": "2D Plane",
                "depthOfField": "None",
                "framingRule": "Generous Negative Space"
            },
            "lighting": {
                "style": "Uniform Ambient",
                "quality": "Flat",
                "contrast": "High (Black on White)",
                "temperature": "Neutral",
                "atmospherics": "Clean Digital"
            },
            "aesthetics": {
                "colorGrade": "Saturated Accents",
                "clarity": "Vector Sharpness",
                "textureOverlay": "None",
                "primarySurfaceMaterial": "Digital Canvas"
            },
            // ⬇️ FIXED: Logo is clearly rendered in the same monoline style
            "brandApplication": {
                "integrationMethod": "Monoline Vector Rendering",
                "materiality": "Same Weight Stroke as Illustration",
                "lightingInteraction": "None (Flat Vector)",
                "prominence": "Prominent Corner or Header Placement"
            }
        }
    }
];

async function main() {
    console.log(`Fixing ${fixes.length} styles with better logo configs...`);

    for (const item of fixes) {
        console.log(`Updating ${item.name} (${item.id})...`);

        const { error } = await supabase
            .from('styles')
            .update({ config: item.config })
            .eq('id', item.id);

        if (error) {
            console.error(`FAILED to update ${item.name}:`, error);
        } else {
            console.log(`✅ Fixed: ${item.name}`);
        }
    }
}

main();
