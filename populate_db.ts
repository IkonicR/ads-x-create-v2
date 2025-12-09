import { StorageService } from './services/storage';
import { StylePreset } from './types';

// Simple ID generator since crypto might not be available in all contexts
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const presets: any[] = [
    {
        id: generateId(),
        name: "The Hero Shot",
        description: "High-conversion product detail page (PDP) image.",
        icon: "Camera",
        promptModifier: "", // Required by type
        config: {
            layout: "centered_hero",
            camera: "Eye-level, 50mm lens, shallow depth of field",
            lighting: "Professional product illumination (Adhere to Style Directive)",
            negative_space: "Generous padding around subject",
            text_slots: [
                { role: "headline", position: "bottom-center", style: "Minimal, Sans-Serif" }
            ]
        }
    },
    {
        id: generateId(),
        name: "Lifestyle In-Use",
        description: "Show the product being used in a real-world setting.",
        icon: "Users",
        promptModifier: "",
        config: {
            layout: "rule_of_thirds_subject",
            camera: "Wide angle, 35mm, candid shot",
            lighting: "Natural or ambient light (Adhere to Style Directive)",
            negative_space: "Integrated into environment",
            text_slots: [
                { role: "headline", position: "top-left", style: "Integrated into scene" },
                { role: "subhead", position: "bottom-left", style: "Small caption" }
            ]
        }
    },
    {
        id: generateId(),
        name: "The Flat Lay",
        description: "Show contents, ingredients, or a 'kit' view.",
        icon: "Grid",
        promptModifier: "",
        config: {
            layout: "knolling_grid",
            camera: "Top-down (90 degree), flat lay",
            lighting: "Even, shadow-free illumination (Adhere to Style Directive)",
            negative_space: "Evenly distributed",
            text_slots: [
                { role: "headline", position: "center-overlay", style: "Bold, contrasting color" }
            ]
        }
    },
    {
        id: generateId(),
        name: "Benefit Highlight",
        description: "Explain a key feature or benefit visually.",
        icon: "Zap",
        promptModifier: "",
        config: {
            layout: "split_horizontal_60_40",
            camera: "Macro close-up on feature",
            lighting: "Focused illumination on subject (Adhere to Style Directive)",
            negative_space: "Right side empty for text",
            text_slots: [
                { role: "headline", position: "center-right", style: "Large, Bold" },
                { role: "subhead", position: "below-headline", "style": "Bullet points" }
            ]
        }
    },
    {
        id: generateId(),
        name: "The Infographic",
        description: "Convey complex information or steps clearly.",
        icon: "List",
        promptModifier: "Clean infographic layout, clear data visualization, organized information hierarchy.",
        config: {
            layout: "infographic_sidebar",
            camera: "Straight-on, flat focal plane",
            lighting: "Clear, legible illumination (Adhere to Style Directive)",
            negative_space: "Left 40% empty for text column",
            text_slots: [
                { role: "headline", position: "top-left", style: "Bold, Large" },
                { role: "subhead", position: "below-headline", "style": "Medium" },
                { role: "body", position: "left-column", style: "Flexible content area" } // Changed from body_list to body
            ]
        }
    }
];

const styles: StylePreset[] = [
    {
        id: generateId(),
        name: "Clay-Pop",
        description: "Soft matte clay on a clean studio backdrop.",
        imageUrl: "/artifacts/style_minimalist_studio_1764372951731.png", // Placeholder
        promptModifier: "Soft sculpted clay forms, Velvet matte surface, Subtle pores and dimples, Rounded edges and seams. High-end 3D render.",
        styleCues: ["Soft sculpted clay forms", "Velvet matte surface", "Subtle pores and dimples", "Rounded edges and seams"],
        avoid: ["Harsh reflections", "Glossy surfaces", "Sharp edges"]
    },
    {
        id: generateId(),
        name: "Nostalgia Royale",
        description: "Poster serenity—deep field, soft shading.",
        imageUrl: "/artifacts/style_dark_mode_luxury_1764372963928.png", // Placeholder
        promptModifier: "Flat poster silhouettes, Deep single colour field, Broad soft interior shading, Mid century simplified forms.",
        styleCues: ["Flat poster silhouettes", "Deep single colour field", "Broad soft interior shading", "Mid century simplified forms"],
        avoid: ["Glossy highlights", "Photorealism", "Complex textures"]
    },
    {
        id: generateId(),
        name: "Playful Line Art",
        description: "Playful monoline on near-white.",
        imageUrl: "/artifacts/style_organic_natural_1764372992280.png", // Placeholder
        promptModifier: "Rounded monoline outlines, Near white paper background, Generous negative space, Halftone dots on hero.",
        styleCues: ["Rounded monoline outlines", "Near white paper background", "Generous negative space", "Halftone dots on hero"],
        avoid: ["Gradients", "Complex shading", "Photorealism"]
    },
    {
        id: generateId(),
        name: "Printissimo",
        description: "Punchy riso poster—bold spot inks.",
        imageUrl: "/artifacts/style_black_friday_1764373005763.png", // Placeholder
        promptModifier: "Light paper texture, Two to three spot inks, Deliberate misregistration, Halftone dot shading.",
        styleCues: ["Light paper texture", "Two to three spot inks", "Deliberate misregistration", "Halftone dot shading"],
        avoid: ["Soft airbrush glows", "Digital gradients", "Perfect registration"]
    }
];

export const populateDatabase = async () => {
    console.log("Starting population...");

    // 1. Cleanup Existing Data
    console.log("Cleaning up old data...");
    // Presets cleanup removed as per instruction

    const existingStyles = await StorageService.getStyles();
    for (const s of existingStyles) {
        await StorageService.deleteStyle(s.id);
    }

    // 2. Save New Presets (Removed as per instruction)

    // 3. Save New Styles
    for (const style of styles) {
        console.log(`Saving Style: ${style.name}`);
        await StorageService.saveStyle(style);
    }

    console.log("Population complete!");
};

