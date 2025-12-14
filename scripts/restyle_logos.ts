
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * RESTYLE: Logo configs now describe HOW the logo should LOOK,
 * not WHERE it should go. Let the AI decide placement.
 */

const styleUpdates = [
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
            // Logo is a 3D CLAY OBJECT - same material as the scene
            "brandApplication": {
                "integrationMethod": "Sculpted as a 3D clay form, extruded from the same material as the scene",
                "materiality": "Velvet matte clay with subtle fingerprint impressions and soft rounded edges",
                "lightingInteraction": "Catches the same soft diffused light, gentle ambient occlusion in the embossed areas"
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
            // Logo is SCREENPRINTED - limited palette, gritty, vintage
            "brandApplication": {
                "integrationMethod": "Screenprinted in 1-2 spot colors, as if hand-pulled through a silkscreen",
                "materiality": "Thick opaque ink sitting on top of textured paper, slight halftone grain visible at edges",
                "lightingInteraction": "Completely flat, matte finish - no shine, no reflections, aged and worn like the rest of the poster"
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
                "textureOverlay": "None",
                "primarySurfaceMaterial": "Digital Canvas"
            },
            // Logo is REDRAWN as a MONOLINE - same stroke weight, playful
            "brandApplication": {
                "integrationMethod": "Redrawn as a continuous single-weight monoline stroke, simplified to match the illustration style",
                "materiality": "Clean vector strokes with perfectly round caps, same stroke weight as the rest of the artwork",
                "lightingInteraction": "None - pure flat vector, crisp edges, solid fill or stroke only"
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
            // Logo is RISO-PRINTED - chunky halftone, misregistration, punk energy
            "brandApplication": {
                "integrationMethod": "Riso-printed with deliberate misregistration between color layers, like a photocopied punk zine",
                "materiality": "Chunky halftone dots visible, soy-based ink bleeding slightly into uncoated stock",
                "lightingInteraction": "Completely matte, no sheen - the ink absorbs into the rough paper fiber"
            }
        }
    },
    {
        name: "Editorial Pop",
        id: "9a070e65-ff68-4d58-b05a-13b1fb45eaa4",
        config: {
            "schemaVersion": "3.0",
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
            },
            "viewpoint": {
                "angle": "Eye Level",
                "shotType": "Medium Close-Up",
                "framingRule": "Central Subject with Negative Space",
                "perspective": "50mm Portrait Lens",
                "depthOfField": "Shallow (Subject Focus)"
            },
            "lighting": {
                "style": "Butterfly Lighting / Softbox",
                "quality": "Diffused / Soft",
                "contrast": "Muted / Low",
                "temperature": "Cool Studio Grey",
                "atmospherics": "Clean Studio Air"
            },
            "aesthetics": {
                "clarity": "Soft Skin / Sharp Typography",
                "colorGrade": "Monochrome / Desaturated",
                "textureOverlay": "Fine Art Paper Grain",
                "primarySurfaceMaterial": "Studio Seamless Backdrop"
            },
            // Logo is LUXURY PRINT - varnished, tactile, catches light
            "brandApplication": {
                "integrationMethod": "Printed directly onto the surface with a Spot UV gloss varnish layer",
                "materiality": "High-gloss lacquer finish that catches the studio light, creating a subtle texture contrast against matte paper",
                "lightingInteraction": "Sharp specular catchlights where the varnish reflects the softbox, magazine-quality tactile feel"
            }
        }
    }
];

async function main() {
    console.log(`Restyling ${styleUpdates.length} styles with creative logo treatments...`);

    for (const item of styleUpdates) {
        console.log(`Updating ${item.name}...`);

        const { error } = await supabase
            .from('styles')
            .update({ config: item.config })
            .eq('id', item.id);

        if (error) {
            console.error(`FAILED: ${item.name}:`, error);
        } else {
            console.log(`✅ ${item.name}`);
        }
    }

    console.log('\nDone! All logo configs now describe STYLING, not placement.');
}

main();
