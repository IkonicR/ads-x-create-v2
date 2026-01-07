import React, { useState } from 'react';
import { StylePreset, ProductionPresetConfig } from '../../types';
import { NeuButton, NeuInput, NeuTextArea, useThemeStyles } from '../NeuComponents';
import { NeuImageUploader } from '../NeuImageUploader';
import {
    Trash2, Save, CheckCircle2, XCircle, Copy, FileJson, Clipboard,
    ChevronDown, Wand2, X, Settings, Image, Code, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// V2 God-Tier Default Config Template
const DEFAULT_V2_CONFIG: ProductionPresetConfig = {
    schemaVersion: '3.0',
    mediumController: {
        medium: 'Photography',
        executionDetails: {
            cameraSystem: 'FullFrame_DSLR',
            shotStyle: 'Studio_Product'
        }
    },
    viewpoint: {
        shotType: 'MCU',
        angle: 'Eye-Level',
        perspective: 'Standard',
        depthOfField: 'Shallow',
        framingRule: 'Rule_of_Thirds'
    },
    brandApplication: {
        integrationMethod: 'Integrated_3D_Object',
        materiality: 'Matte_Finish',
        lightingInteraction: 'Standard',
        prominence: 'Integrated'
    },
    lighting: {
        style: 'Three-Point_Studio',
        quality: 'Soft_Diffused',
        contrast: 'Medium',
        temperature: '5600K_Daylight',
        atmospherics: 'Clear'
    },
    aesthetics: {
        colorGrade: 'Neutral',
        clarity: 'High',
        textureOverlay: 'None',
        primarySurfaceMaterial: 'Matte'
    }
};

type TabId = 'general' | 'director' | 'references' | 'json';

interface StyleEditorTabsProps {
    item: StylePreset;
    onChange: (item: StylePreset) => void;
    onSave: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export const StyleEditorTabs: React.FC<StyleEditorTabsProps> = ({
    item,
    onChange,
    onSave,
    onDelete,
    onClose
}) => {
    const { styles } = useThemeStyles();
    const [activeTab, setActiveTab] = useState<TabId>('general');

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'General', icon: <FileText size={14} /> },
        { id: 'director', label: "Director's Panel", icon: <Wand2 size={14} /> },
        { id: 'references', label: 'References', icon: <Image size={14} /> },
        { id: 'json', label: 'JSON', icon: <Code size={14} /> },
    ];

    // ─────────────────────────────────────────────────────────────────────
    // JSON TOOLS (preserved from original)
    // ─────────────────────────────────────────────────────────────────────
    const handleCopyJSON = () => {
        const { id, imageUrl, referenceImages, ...cleanItem } = item as any;
        navigator.clipboard.writeText(JSON.stringify(cleanItem, null, 2));
        alert("Style config copied! (Images excluded - upload those separately)");
    };

    const handleCopyTemplate = () => {
        const fullTemplate = {
            name: "New Style Name",
            description: "Short UI description",
            config: {
                schemaVersion: "3.0",
                mediumController: { medium: "", executionDetails: { cameraSystem: "", shotStyle: "", renderEngine: "", style: "", technique: "", brushwork: "" } },
                viewpoint: { shotType: "", angle: "", perspective: "", depthOfField: "", framingRule: "" },
                brandApplication: { integrationMethod: "", materiality: "", lightingInteraction: "", prominence: "" },
                lighting: { style: "", quality: "", contrast: "", temperature: "", atmospherics: "" },
                aesthetics: { colorGrade: "", clarity: "", textureOverlay: "", primarySurfaceMaterial: "" }
            },
            styleCues: [],
            avoid: [],
            isActive: true,
            sortOrder: 0
        };
        navigator.clipboard.writeText(JSON.stringify(fullTemplate, null, 2));
        alert("V2 Template copied! Paste into ChatGPT/Claude to generate a style.");
    };

    const handlePasteJSON = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const json = JSON.parse(text);
            if (!json.name) throw new Error("Invalid JSON: Missing 'name' field");
            if (!json.config && !json.promptModifier) throw new Error("Invalid JSON: Need either 'config' (V2) or 'promptModifier' (legacy)");
            onChange({ ...item, ...json, id: item.id });
            alert("Style updated from JSON!");
        } catch (e: any) {
            alert(`Failed to paste JSON: ${e.message || 'Check format.'}`);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`mt-6 rounded-2xl ${styles.bg} ${styles.shadowIn} border border-white/5 overflow-hidden`}
        >
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="flex justify-between items-center p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <h4 className={`font-bold ${styles.textMain}`}>
                        Editing: {item.name || 'New Style'}
                    </h4>
                    <span className={`text-[10px] font-mono ${styles.textSub} opacity-50`}>
                        {item.id?.slice(0, 8)}...
                    </span>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={onDelete}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Style"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={onClose}
                        className={`p-2 ${styles.textSub} hover:${styles.textMain} hover:bg-white/5 rounded-lg transition-colors`}
                        title="Close Editor"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TAB BAR */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="flex gap-1 p-2 border-b border-white/5 bg-black/10">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                ? `bg-brand text-white ${styles.shadowIn}`
                                : `${styles.textSub} hover:${styles.textMain} hover:bg-white/5`
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TAB CONTENT */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="p-6">
                {/* ─────────────────────────────────────────────────────────────── */}
                {/* TAB: GENERAL */}
                {/* ─────────────────────────────────────────────────────────────── */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Name (UI Label)</label>
                                <NeuInput
                                    value={item.name}
                                    onChange={(e) => onChange({ ...item, name: e.target.value })}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Sort Order</label>
                                <NeuInput
                                    type="number"
                                    value={item.sortOrder?.toString() || '0'}
                                    onChange={(e) => onChange({ ...item, sortOrder: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="col-span-1 flex items-end pb-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={item.isActive ?? true}
                                        onChange={(e) => onChange({ ...item, isActive: e.target.checked })}
                                        className="w-4 h-4 accent-brand"
                                    />
                                    <span className={`text-xs font-bold ${styles.textMain}`}>Active</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Description (UI Subtitle)</label>
                            <NeuInput
                                value={item.description}
                                onChange={(e) => onChange({ ...item, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>
                                Prompt Modifier (Hidden Instruction)
                            </label>
                            <NeuTextArea
                                value={item.promptModifier}
                                onChange={(e) => onChange({ ...item, promptModifier: e.target.value })}
                                className="h-24 text-xs font-mono"
                                placeholder="Describe the visual style in detail for the AI..."
                            />
                        </div>

                        {/* Style Cues & Avoidance */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`text-xs font-bold ${styles.textSub} mb-1 block flex items-center gap-1`}>
                                    <CheckCircle2 size={12} className="text-green-500" /> Style Cues (Positive)
                                </label>
                                <NeuTextArea
                                    value={item.styleCues?.join(', ') || ''}
                                    onChange={(e) => onChange({
                                        ...item,
                                        styleCues: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                                    })}
                                    placeholder="e.g. Minimalist, Warm Lighting, Grainy Film..."
                                    className="h-20 text-xs"
                                />
                                <p className="text-[9px] opacity-40 mt-1">Comma separated list of vibes to enforce.</p>
                            </div>
                            <div>
                                <label className={`text-xs font-bold ${styles.textSub} mb-1 block flex items-center gap-1`}>
                                    <XCircle size={12} className="text-red-500" /> Avoid (Negative)
                                </label>
                                <NeuTextArea
                                    value={item.avoid?.join(', ') || ''}
                                    onChange={(e) => onChange({
                                        ...item,
                                        avoid: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                                    })}
                                    placeholder="e.g. Blurry, Distorted, Text overlay..."
                                    className="h-20 text-xs"
                                />
                                <p className="text-[9px] opacity-40 mt-1">Comma separated list of things to ban.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────── */}
                {/* TAB: DIRECTOR'S PANEL (V2 Config) */}
                {/* ─────────────────────────────────────────────────────────────── */}
                {activeTab === 'director' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-brand/10 border border-purple-500/20 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className={`text-xs font-bold ${styles.textMain} flex items-center gap-2`}>
                                    <Wand2 size={14} className="text-purple-400" />
                                    V2 Production Preset
                                </label>
                                <button
                                    type="button"
                                    onClick={() => onChange({ ...item, config: DEFAULT_V2_CONFIG })}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 bg-purple-500/10 rounded-lg transition-colors"
                                >
                                    Reset Defaults
                                </button>
                            </div>

                            {/* SECTION 1: MEDIUM CONTROLLER */}
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">1. Medium Controller</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Medium</label>
                                        <NeuInput
                                            value={item.config?.mediumController?.medium || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: {
                                                    ...DEFAULT_V2_CONFIG,
                                                    ...item.config,
                                                    mediumController: { ...item.config?.mediumController, medium: e.target.value }
                                                }
                                            })}
                                            placeholder="e.g. Photography, 3D Render, Illustration..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Camera System / Render Engine</label>
                                        <NeuInput
                                            value={item.config?.mediumController?.executionDetails?.cameraSystem || item.config?.mediumController?.executionDetails?.renderEngine || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: {
                                                    ...DEFAULT_V2_CONFIG,
                                                    ...item.config,
                                                    mediumController: {
                                                        ...item.config?.mediumController,
                                                        executionDetails: { ...item.config?.mediumController?.executionDetails, cameraSystem: e.target.value, renderEngine: e.target.value }
                                                    }
                                                }
                                            })}
                                            placeholder="e.g. Hasselblad, Octane, Blender..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Shot/Render Style</label>
                                        <NeuInput
                                            value={item.config?.mediumController?.executionDetails?.shotStyle || item.config?.mediumController?.executionDetails?.style || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: {
                                                    ...DEFAULT_V2_CONFIG,
                                                    ...item.config,
                                                    mediumController: {
                                                        ...item.config?.mediumController,
                                                        executionDetails: { ...item.config?.mediumController?.executionDetails, shotStyle: e.target.value, style: e.target.value }
                                                    }
                                                }
                                            })}
                                            placeholder="e.g. Studio Product, Hyperrealistic..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Technique / Brushwork</label>
                                        <NeuInput
                                            value={item.config?.mediumController?.executionDetails?.technique || item.config?.mediumController?.executionDetails?.brushwork || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: {
                                                    ...DEFAULT_V2_CONFIG,
                                                    ...item.config,
                                                    mediumController: {
                                                        ...item.config?.mediumController,
                                                        executionDetails: { ...item.config?.mediumController?.executionDetails, technique: e.target.value, brushwork: e.target.value }
                                                    }
                                                }
                                            })}
                                            placeholder="e.g. Watercolor, Smooth blended..."
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: VIEWPOINT */}
                            <div className="space-y-2 pt-3 border-t border-purple-500/10">
                                <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">2. Viewpoint (Composition)</h5>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Shot Type</label>
                                        <NeuInput
                                            value={item.config?.viewpoint?.shotType || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, viewpoint: { ...item.config?.viewpoint, shotType: e.target.value } }
                                            })}
                                            placeholder="ECU, Medium Shot, Wide..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Camera Angle</label>
                                        <NeuInput
                                            value={item.config?.viewpoint?.angle || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, viewpoint: { ...item.config?.viewpoint, angle: e.target.value } }
                                            })}
                                            placeholder="Eye-Level, Low-Angle Hero..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Perspective / Lens</label>
                                        <NeuInput
                                            value={item.config?.viewpoint?.perspective || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, viewpoint: { ...item.config?.viewpoint, perspective: e.target.value } }
                                            })}
                                            placeholder="50mm Standard, 135mm Telephoto..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Depth of Field</label>
                                        <NeuInput
                                            value={item.config?.viewpoint?.depthOfField || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, viewpoint: { ...item.config?.viewpoint, depthOfField: e.target.value } }
                                            })}
                                            placeholder="Shallow f/2.8, Deep Focus..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Framing / Composition Rule</label>
                                        <NeuInput
                                            value={item.config?.viewpoint?.framingRule || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, viewpoint: { ...item.config?.viewpoint, framingRule: e.target.value } }
                                            })}
                                            placeholder="Rule of Thirds, Centered, Golden Ratio..."
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: BRAND APPLICATION */}
                            <div className="space-y-2 pt-3 border-t border-purple-500/10">
                                <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">3. Logo / Brand Application</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Integration Method</label>
                                        <NeuInput
                                            value={item.config?.brandApplication?.integrationMethod || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, brandApplication: { ...item.config?.brandApplication, integrationMethod: e.target.value } }
                                            })}
                                            placeholder="Embossed, 3D Object, Neon Sign..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Logo Materiality</label>
                                        <NeuInput
                                            value={item.config?.brandApplication?.materiality || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, brandApplication: { ...item.config?.brandApplication, materiality: e.target.value } }
                                            })}
                                            placeholder="Gold Foil, Polished Chrome, Neon..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Lighting Interaction</label>
                                        <NeuInput
                                            value={item.config?.brandApplication?.lightingInteraction || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, brandApplication: { ...item.config?.brandApplication, lightingInteraction: e.target.value } }
                                            })}
                                            placeholder="Standard, Backlit, Glowing..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Prominence</label>
                                        <NeuInput
                                            value={item.config?.brandApplication?.prominence || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, brandApplication: { ...item.config?.brandApplication, prominence: e.target.value } }
                                            })}
                                            placeholder="Subtle, Integrated, Dominant..."
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: LIGHTING */}
                            <div className="space-y-2 pt-3 border-t border-purple-500/10">
                                <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">4. Lighting & Atmosphere</h5>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Lighting Style</label>
                                        <NeuInput
                                            value={item.config?.lighting?.style || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, lighting: { ...item.config?.lighting, style: e.target.value } }
                                            })}
                                            placeholder="Rembrandt, Split, High-Key..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Quality</label>
                                        <NeuInput
                                            value={item.config?.lighting?.quality || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, lighting: { ...item.config?.lighting, quality: e.target.value } }
                                            })}
                                            placeholder="Soft Diffused, Hard Specular..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Contrast</label>
                                        <NeuInput
                                            value={item.config?.lighting?.contrast || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, lighting: { ...item.config?.lighting, contrast: e.target.value } }
                                            })}
                                            placeholder="Flat, Medium, Dramatic 4:1..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Color Temperature</label>
                                        <NeuInput
                                            value={item.config?.lighting?.temperature || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, lighting: { ...item.config?.lighting, temperature: e.target.value } }
                                            })}
                                            placeholder="5600K Daylight, 2700K Warm..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Atmospherics</label>
                                        <NeuInput
                                            value={item.config?.lighting?.atmospherics || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, lighting: { ...item.config?.lighting, atmospherics: e.target.value } }
                                            })}
                                            placeholder="Clear, Light Haze, Volumetric Fog..."
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 5: AESTHETICS */}
                            <div className="space-y-2 pt-3 border-t border-purple-500/10">
                                <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">5. Aesthetics & Finish</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Color Grade</label>
                                        <NeuInput
                                            value={item.config?.aesthetics?.colorGrade || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, aesthetics: { ...item.config?.aesthetics, colorGrade: e.target.value } }
                                            })}
                                            placeholder="Teal & Orange, Vintage Film..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Clarity / Sharpness</label>
                                        <NeuInput
                                            value={item.config?.aesthetics?.clarity || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, aesthetics: { ...item.config?.aesthetics, clarity: e.target.value } }
                                            })}
                                            placeholder="Soft Dreamy, Crisp High..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Texture Overlay</label>
                                        <NeuInput
                                            value={item.config?.aesthetics?.textureOverlay || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, aesthetics: { ...item.config?.aesthetics, textureOverlay: e.target.value } }
                                            })}
                                            placeholder="None, Fine Grain, Halftone..."
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Surface Material</label>
                                        <NeuInput
                                            value={item.config?.aesthetics?.primarySurfaceMaterial || ''}
                                            onChange={(e) => onChange({
                                                ...item,
                                                config: { ...DEFAULT_V2_CONFIG, ...item.config, aesthetics: { ...item.config?.aesthetics, primarySurfaceMaterial: e.target.value } }
                                            })}
                                            placeholder="Matte, High-Gloss, Metallic..."
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────── */}
                {/* TAB: REFERENCES (Images) */}
                {/* ─────────────────────────────────────────────────────────────── */}
                {activeTab === 'references' && (
                    <div className="space-y-4 animate-fade-in">
                        <label className={`text-xs font-bold ${styles.textSub} mb-2 block flex items-center gap-2`}>
                            Style Assets (AI References)
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[9px] uppercase">Crucial</span>
                        </label>

                        <div className="grid grid-cols-4 gap-2">
                            {/* Existing Images */}
                            {((item as any).referenceImages || []).map((refImg: any, idx: number) => {
                                const url = typeof refImg === 'string' ? refImg : refImg.url;
                                const isActive = typeof refImg === 'string' ? true : refImg.isActive;
                                const id = typeof refImg === 'string' ? url : refImg.id;
                                const isThumbnail = url === item.imageUrl;

                                return (
                                    <div key={id || idx}
                                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${isThumbnail ? 'border-brand ring-2 ring-brand/20' : 'border-transparent hover:border-white/20'} ${!isActive ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <img src={url} className="w-full h-full object-cover" />

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                            {/* Top Row: Move */}
                                            <div className="flex gap-1 w-full justify-between px-1">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newRefs = [...((item as any).referenceImages || [])];
                                                        if (idx > 0) {
                                                            [newRefs[idx - 1], newRefs[idx]] = [newRefs[idx], newRefs[idx - 1]];
                                                            onChange({ ...item, referenceImages: newRefs } as any);
                                                        }
                                                    }}
                                                    className="p-1 text-white hover:text-brand disabled:opacity-30"
                                                >
                                                    &lt;
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === ((item as any).referenceImages?.length || 0) - 1}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newRefs = [...((item as any).referenceImages || [])];
                                                        if (idx < newRefs.length - 1) {
                                                            [newRefs[idx], newRefs[idx + 1]] = [newRefs[idx + 1], newRefs[idx]];
                                                            onChange({ ...item, referenceImages: newRefs } as any);
                                                        }
                                                    }}
                                                    className="p-1 text-white hover:text-brand disabled:opacity-30"
                                                >
                                                    &gt;
                                                </button>
                                            </div>

                                            {/* Middle: Toggle & Cover */}
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newRefs = [...((item as any).referenceImages || [])];
                                                        if (typeof newRefs[idx] === 'string') {
                                                            newRefs[idx] = { id: newRefs[idx], url: newRefs[idx], isActive: false };
                                                        } else {
                                                            newRefs[idx] = { ...newRefs[idx], isActive: !newRefs[idx].isActive };
                                                        }
                                                        onChange({ ...item, referenceImages: newRefs } as any);
                                                    }}
                                                    className={`p-1 rounded-full ${isActive ? 'text-green-400' : 'text-gray-400'}`}
                                                    title={isActive ? "Disable" : "Enable"}
                                                >
                                                    {isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => onChange({ ...item, imageUrl: url })}
                                                    className={`px-2 py-0.5 rounded text-[8px] font-bold backdrop-blur-md transition-all ${isThumbnail
                                                        ? 'bg-brand text-white'
                                                        : 'bg-white/20 text-white hover:bg-white/40'
                                                        }`}
                                                >
                                                    {isThumbnail ? 'Cover' : 'Set Cover'}
                                                </button>
                                            </div>

                                            {/* Bottom: Delete */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newRefs = [...((item as any).referenceImages || [])];
                                                    newRefs.splice(idx, 1);
                                                    const updates: any = { referenceImages: newRefs };
                                                    if (isThumbnail) updates.imageUrl = '';
                                                    onChange({ ...item, ...updates });
                                                }}
                                                className="mt-1 p-1 text-red-400 hover:text-red-500"
                                                title="Remove Asset"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Upload Area */}
                        <div className="mt-4">
                            <NeuImageUploader
                                uploadMode="system"
                                folder="styles"
                                multiple={true}
                                onUpload={(urls) => {
                                    const newUrls = Array.isArray(urls) ? urls : [urls];
                                    const newObjs = newUrls.map(u => ({
                                        id: crypto.randomUUID(),
                                        url: u,
                                        isActive: true
                                    }));
                                    const currentRefs = (item as any).referenceImages || [];
                                    const updatedRefs = [...currentRefs, ...newObjs];
                                    const updates: any = { referenceImages: updatedRefs };
                                    if (!item.imageUrl && newUrls.length > 0) {
                                        updates.imageUrl = newUrls[0];
                                    }
                                    onChange({ ...item, ...updates });
                                }}
                                currentValue=""
                            />
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────── */}
                {/* TAB: JSON */}
                {/* ─────────────────────────────────────────────────────────────── */}
                {activeTab === 'json' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={handleCopyJSON}
                                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-brand transition-colors rounded-lg bg-white/5 hover:bg-white/10"
                            >
                                <Copy size={12} /> Copy Config
                            </button>
                            <button
                                onClick={handlePasteJSON}
                                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-brand transition-colors rounded-lg bg-white/5 hover:bg-white/10"
                            >
                                <Clipboard size={12} /> Paste Config
                            </button>
                            <button
                                onClick={handleCopyTemplate}
                                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-brand transition-colors rounded-lg bg-white/5 hover:bg-white/10"
                            >
                                <FileJson size={12} /> Copy Template
                            </button>
                        </div>

                        <div>
                            <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>V2 Config JSON</label>
                            <NeuTextArea
                                value={JSON.stringify(item.config || DEFAULT_V2_CONFIG, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        onChange({ ...item, config: parsed });
                                    } catch { /* Invalid JSON */ }
                                }}
                                className="h-64 text-[10px] font-mono bg-black/30"
                                placeholder="Paste V2 config JSON..."
                            />
                        </div>

                        <details className="mt-3">
                            <summary className="cursor-pointer text-[9px] font-bold text-gray-500 hover:text-gray-400 flex items-center gap-1 select-none">
                                <ChevronDown size={10} /> Legacy: Prompt Modifier (Fallback)
                            </summary>
                            <div className="mt-2">
                                <NeuTextArea
                                    value={item.promptModifier || ''}
                                    onChange={(e) => onChange({ ...item, promptModifier: e.target.value })}
                                    className="h-16 text-xs font-mono"
                                    placeholder="Legacy fallback if no V2 config..."
                                />
                            </div>
                        </details>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* FOOTER */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="p-4 border-t border-white/5">
                <NeuButton type="button" variant="primary" className="w-full h-12" onClick={onSave}>
                    <Save size={18} /> Save Changes
                </NeuButton>
            </div>
        </motion.div>
    );
};
