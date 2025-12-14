
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

const updates = [
    {
        name: "Clay-Pop",
        id: "34c7404e-03e8-431e-90ac-65b9f83bc0d0",
        config: {
            "schemaVersion": "3.0",
            "mediumController": {
                "medium": "3D Render",
                "executionDetails": {
                    "renderEngine": "Octane Render",
                    "style": "Clay Maquette",
                    "technique": "Digital Sculpting",
                    "brushwork": "Smooth blended",
                    "cameraSystem": "Virtual Macro",
                    "shotStyle": "Product Studio"
                }
            },
            "viewpoint": {
                "shotType": "Isometric or 45-Degree Angle",
                "angle": "High-Angle",
                "perspective": "Orthographic-like (Telephoto)",
                "depthOfField": "Shallow f/2.8 (Tilt-Shift feel)",
                "framingRule": "Centered Dominance"
            },
            "lighting": {
                "style": "Softbox Global Illumination",
                "quality": "Soft Diffused",
                "contrast": "Soft 2:1",
                "temperature": "Neutral Warm 4000K",
                "atmospherics": "Clean Studio Air"
            },
            "aesthetics": {
                "colorGrade": "Pastel / High Key",
                "clarity": "Soft Smoothness",
                "textureOverlay": "None",
                "primarySurfaceMaterial": "Matte Plastic / Clay"
            },
            "brandApplication": {
                "integrationMethod": "Embossed / Debossed",
                "materiality": "Same as Object (Clay)",
                "lightingInteraction": "Self-Shadowing (AO)",
                "prominence": "Integrated"
            }
        }
    },
    {
        name: "Nostalgia Royale",
        id: "66f58de4-5839-4ac8-bc32-c86c0962545d",
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
            "brandApplication": {
                "integrationMethod": "Overprint / Multiply Mode",
                "materiality": "Ink on Paper",
                "lightingInteraction": "None (Flat)",
                "prominence": "Subtle Watermark"
            }
        }
    },
    {
        name: "Playful Line Art",
        id: "558c80e7-5a60-4b90-b8b4-400252a39e81",
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
                "textureOverlay": "Subtle Paper Grain (Optional)",
                "primarySurfaceMaterial": "Digital Canvas"
            },
            "brandApplication": {
                "integrationMethod": "Line Art Integration",
                "materiality": "Digital Ink",
                "lightingInteraction": "None",
                "prominence": "Standard"
            }
        }
    },
    {
        name: "Printissimo",
        id: "b75e3202-d5be-4b64-917f-c947340901e1",
        config: {
            "schemaVersion": "3.0",
            "mediumController": {
                "medium": "Mixed Media / Print",
                "executionDetails": {
                    "style": "Risograph / Silkscreen",
                    "technique": "Halftone Separation",
                    "brushwork": "N/A",
                    "complexity": "Bold Graphic",
                    "vectorStyle": "Distressed Edge"
                }
            },
            "viewpoint": {
                "shotType": "Poster Composition",
                "angle": "Flat",
                "perspective": "2D",
                "depthOfField": "None",
                "framingRule": "Grid-Based Typography"
            },
            "lighting": {
                "style": "Flat",
                "quality": "Hard",
                "contrast": "Extreme (Ink vs Paper)",
                "temperature": "Cool / Fluorescent",
                "atmospherics": "Ink Bleed"
            },
            "aesthetics": {
                "colorGrade": "CMYK / Spot Color",
                "clarity": "Halftone Pattern Visible",
                "textureOverlay": "Rough Rice Paper",
                "primarySurfaceMaterial": "Uncoated Paper"
            },
            "brandApplication": {
                "integrationMethod": "Stamp / Stencil",
                "materiality": "Thick Ink",
                "lightingInteraction": "Matte",
                "prominence": "Prominent"
            }
        }
    },
    {
        name: "Editorial Pop",
        id: "9a070e65-ff68-4d58-b05a-13b1fb45eaa4", // Partial Update for Editorial
        configUpdate: true, // Marker to merge/override specific fields if we wanted partial, but here I'll provide full new config to be safe
        // RE-USING EXISTING CONFIG but modifying brandApplication
        config: {
            "lighting": {
                "style": "Butterfly Lighting / Softbox",
                "quality": "Diffused / Soft",
                "contrast": "Muted / Low",
                "temperature": "Cool Studio Grey",
                "atmospherics": "Clean Studio Air"
            },
            "viewpoint": {
                "angle": "Eye Level",
                "shotType": "Medium Close-Up",
                "framingRule": "Central Subject with Negative Space",
                "perspective": "50mm Portrait Lens",
                "depthOfField": "Shallow (Subject Focus)"
            },
            "aesthetics": {
                "clarity": "Soft Skin / Sharp Typography",
                "colorGrade": "Monochrome / Desaturated",
                "textureOverlay": "Fine Art Paper Grain",
                "primarySurfaceMaterial": "Studio Seamless Backdrop"
            },
            "schemaVersion": "3.0",
            "brandApplication": {
                "prominence": "Focal Point Pop",
                "materiality": "Spot UV Gloss / High-Gloss Varnish", // <--- CHANGED
                "integrationMethod": "Printed Directly on Surface",  // <--- CHANGED
                "lightingInteraction": "Sharp Specular Highlight (Catchlight)" // <--- CHANGED
            },
            "mediumController": {
                "medium": "Studio Photography",
                "executionDetails": {
                    "style": "Minimalist Chic",
                    "brushwork": "Clean Lines",
                    "shotStyle": "High Fashion Editorial",
                    "technique": "Studio Portraiture",
                    "cameraSystem": "Medium Format Digital (Hasselblad)",
                    "renderEngine": "Photorealistic"
                }
            }
        }
    }
];

async function main() {
    console.log(`Starting update for ${updates.length} styles...`);

    for (const item of updates) {
        console.log(`Updating ${item.name} (${item.id})...`);

        const { error } = await supabase
            .from('styles')
            .update({ config: item.config })
            .eq('id', item.id);

        if (error) {
            console.error(`FAILED to update ${item.name}:`, error);
        } else {
            console.log(`✅ Success: ${item.name}`);
        }
    }
}

main();
