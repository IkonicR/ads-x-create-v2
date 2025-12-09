import React, { useState } from 'react';
import { StylePreset, ProductionPresetConfig } from '../../types';
import { NeuButton, NeuInput, NeuTextArea } from '../../components/NeuComponents';
import { NeuImageUploader } from '../../components/NeuImageUploader';
import { Palette, Plus, Trash2, Save, Settings, CheckCircle2, XCircle, Copy, FileJson, Clipboard, ChevronDown, Wand2 } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface ConfigTabProps {
    stylesList: StylePreset[];
    setStylesList: (val: StylePreset[]) => void;
    styles: any;
    handleRefresh: () => Promise<void>;
}

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

const TEMPLATE_STYLE = {
    name: "New Style Name",
    description: "Short description for the UI",
    promptModifier: "Detailed visual description for the AI...",
    imageUrl: "",
    config: DEFAULT_V2_CONFIG,
    styleCues: ["Cue 1", "Cue 2"],
    avoid: ["Bad thing 1", "Bad thing 2"],
    isActive: true,
    sortOrder: 0
};

export const ConfigTab: React.FC<ConfigTabProps> = ({ stylesList, setStylesList, styles, handleRefresh }) => {
    const [configTab, setConfigTab] = useState<'styles'>('styles');
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const handleCreateNewConfig = () => {
        const base = {
            id: crypto.randomUUID(),
            name: 'New Item',
            description: '',
            promptModifier: '',
            sortOrder: 0,
            isActive: true
        };
        setEditingItem({ ...base, imageUrl: '', referenceImages: [] });
    };

    const handleSaveConfigItem = async () => {
        if (!editingItem) return;
        const itemToSave = { ...editingItem };
        await StorageService.saveStyle(itemToSave);
        const updated = await StorageService.getStyles();
        setStylesList(updated);
        setEditingItem(null);
        await handleRefresh();
    };

    const handleCopyJSON = () => {
        if (!editingItem) return;
        // Exclude ID and image fields - those are managed via uploader
        const { id, imageUrl, referenceImages, ...cleanItem } = editingItem;
        navigator.clipboard.writeText(JSON.stringify(cleanItem, null, 2));
        alert("Style config copied! (Images excluded - upload those separately)");
    };

    const handleCopyTemplate = () => {
        // Full V2 template - NO image fields (upload those separately)
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

            // V2 validation: must have name and either config or promptModifier
            if (!json.name) {
                throw new Error("Invalid JSON: Missing 'name' field");
            }
            if (!json.config && !json.promptModifier) {
                throw new Error("Invalid JSON: Need either 'config' (V2) or 'promptModifier' (legacy)");
            }

            // Merge with current ID (keep the ID of the item being edited)
            setEditingItem({
                ...editingItem,
                ...json,
                id: editingItem.id // Ensure ID doesn't change
            });
            alert("Style updated from JSON!");
        } catch (e: any) {
            alert(`Failed to paste JSON: ${e.message || 'Check format.'}`);
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 border-b border-gray-200/10 pb-4">
                <button
                    onClick={() => { setConfigTab('styles'); setEditingItem(null); }}
                    className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all border-b-2 ${configTab === 'styles' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-600'
                        } `}
                >
                    <Palette size={16} />
                    Visual Styles (Vibes)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* List/Grid Column - NOW NARROWER (Sidebar) */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className={`text-lg font-bold ${styles.textMain} `}>
                            Styles
                        </h3>
                        <NeuButton type="button" onClick={handleCreateNewConfig} className="px-2 py-1 text-xs">
                            <Plus size={14} />
                        </NeuButton>
                    </div>

                    <div className="max-h-[300px] lg:max-h-[80vh] overflow-y-auto custom-scrollbar pr-2 p-2 pb-4">
                        {/* VISUAL GRID FOR STYLES (Compact) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                            {stylesList
                                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                .map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setEditingItem(item)}
                                        className={`group relative aspect-video rounded-xl overflow-hidden text-left transition-all border-2 ${editingItem?.id === item.id
                                            ? `border-brand ring-2 ring-brand/20`
                                            : `border-transparent hover:border-white/20`
                                            } `}
                                    >
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full ${styles.bg} flex items-center justify-center`}>
                                                <Palette className="text-gray-400" size={20} />
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm">
                                            <span className="text-white font-bold text-[10px] truncate block">{item.name}</span>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Editor Column - NOW WIDER (Main Stage) */}
                <div className="lg:col-span-9 relative">
                    {editingItem ? (
                        <div className={`p-6 rounded-2xl ${styles.bg} ${styles.shadowIn} border border-white/5 space-y-4`}>
                            <div className="flex justify-between items-center mb-2 border-b border-gray-200/10 pb-2">
                                <div>
                                    <h4 className={`font-bold ${styles.textMain} flex items-center gap-2`}>
                                        {editingItem.id.includes(Date.now().toString().slice(0, 5)) ? 'Create New' : 'Edit Item'}
                                    </h4>
                                    <span className={`text-[10px] font-mono ${styles.textSub} opacity-50`}>{editingItem.id}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {/* JSON TOOLS */}
                                    <div className="flex gap-2 mr-4 border-r border-gray-200/10 pr-4">
                                        <button
                                            onClick={handleCopyJSON}
                                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-brand transition-colors rounded-lg hover:bg-white/5"
                                            title="Copy JSON"
                                        >
                                            <Copy size={12} /> Copy
                                        </button>
                                        <button
                                            onClick={handlePasteJSON}
                                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-brand transition-colors rounded-lg hover:bg-white/5"
                                            title="Paste JSON"
                                        >
                                            <Clipboard size={12} /> Paste
                                        </button>
                                        <button
                                            onClick={handleCopyTemplate}
                                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-brand transition-colors rounded-lg hover:bg-white/5"
                                            title="Copy Template"
                                        >
                                            <FileJson size={12} /> Template
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={async (e) => {
                                            try {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure?')) {
                                                    await StorageService.deleteStyle(editingItem.id);
                                                    const updated = await StorageService.getStyles();
                                                    setStylesList(updated);
                                                }
                                                setEditingItem(null);
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        className="text-red-400 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <NeuButton type="button" variant="primary" onClick={handleSaveConfigItem} className="px-3 py-1 text-xs">
                                        <Save size={14} /> Save
                                    </NeuButton>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Name (UI Label)</label>
                                    <NeuInput value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} />
                                </div>

                                <div className="col-span-1">
                                    <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Sort Order</label>
                                    <NeuInput
                                        type="number"
                                        value={editingItem.sortOrder?.toString() || '0'}
                                        onChange={(e) => setEditingItem({ ...editingItem, sortOrder: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="col-span-1 flex items-end pb-3">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={editingItem.isActive ?? true}
                                            onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                                            className="w-4 h-4 accent-brand"
                                        />
                                        <span className={`text-xs font-bold ${styles.textMain} `}>Active</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Description (UI Subtitle)</label>
                                <NeuInput value={editingItem.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} />
                            </div>

                            <div>
                                <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>
                                    Prompt Modifier (Hidden Instruction)
                                </label>
                                <NeuTextArea
                                    value={editingItem.promptModifier}
                                    onChange={(e) => setEditingItem({ ...editingItem, promptModifier: e.target.value })}
                                    className="h-24 text-xs font-mono"
                                    placeholder="Describe the visual style in detail for the AI..."
                                />
                            </div>

                            {/* Type Specific Fields */}
                            <div className="space-y-4 pt-2 border-t border-gray-200/10">
                                {/* Style Cues & Avoidance */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-xs font-bold ${styles.textSub} mb-1 block flex items-center gap-1`}>
                                            <CheckCircle2 size={12} className="text-green-500" /> Style Cues (Positive)
                                        </label>
                                        <NeuTextArea
                                            value={editingItem.styleCues?.join(', ') || ''}
                                            onChange={(e) => setEditingItem({
                                                ...editingItem,
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
                                            value={editingItem.avoid?.join(', ') || ''}
                                            onChange={(e) => setEditingItem({
                                                ...editingItem,
                                                avoid: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                                            })}
                                            placeholder="e.g. Blurry, Distorted, Text overlay..."
                                            className="h-20 text-xs"
                                        />
                                        <p className="text-[9px] opacity-40 mt-1">Comma separated list of things to ban.</p>
                                    </div>
                                </div>

                                {/* ============================================ */}
                                {/* V2 GOD-TIER PRODUCTION PRESET - DIRECTOR'S PANEL */}
                                {/* ============================================ */}
                                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-brand/10 border border-purple-500/20 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={`text-xs font-bold ${styles.textMain} flex items-center gap-2`}>
                                            <Wand2 size={14} className="text-purple-400" />
                                            V2 Director's Panel (Production Preset)
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditingItem({ ...editingItem, config: DEFAULT_V2_CONFIG })}
                                                className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 bg-purple-500/10 rounded-lg transition-colors"
                                            >
                                                Reset Defaults
                                            </button>
                                        </div>
                                    </div>

                                    {/* SECTION 1: MEDIUM CONTROLLER */}
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">1. Medium Controller</h5>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Medium</label>
                                                <NeuInput
                                                    value={editingItem.config?.mediumController?.medium || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: {
                                                            ...DEFAULT_V2_CONFIG,
                                                            ...editingItem.config,
                                                            mediumController: { ...editingItem.config?.mediumController, medium: e.target.value }
                                                        }
                                                    })}
                                                    placeholder="e.g. Photography, 3D Render, Illustration..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Camera System / Render Engine</label>
                                                <NeuInput
                                                    value={editingItem.config?.mediumController?.executionDetails?.cameraSystem || editingItem.config?.mediumController?.executionDetails?.renderEngine || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: {
                                                            ...DEFAULT_V2_CONFIG,
                                                            ...editingItem.config,
                                                            mediumController: {
                                                                ...editingItem.config?.mediumController,
                                                                executionDetails: { ...editingItem.config?.mediumController?.executionDetails, cameraSystem: e.target.value, renderEngine: e.target.value }
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
                                                    value={editingItem.config?.mediumController?.executionDetails?.shotStyle || editingItem.config?.mediumController?.executionDetails?.style || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: {
                                                            ...DEFAULT_V2_CONFIG,
                                                            ...editingItem.config,
                                                            mediumController: {
                                                                ...editingItem.config?.mediumController,
                                                                executionDetails: { ...editingItem.config?.mediumController?.executionDetails, shotStyle: e.target.value, style: e.target.value }
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
                                                    value={editingItem.config?.mediumController?.executionDetails?.technique || editingItem.config?.mediumController?.executionDetails?.brushwork || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: {
                                                            ...DEFAULT_V2_CONFIG,
                                                            ...editingItem.config,
                                                            mediumController: {
                                                                ...editingItem.config?.mediumController,
                                                                executionDetails: { ...editingItem.config?.mediumController?.executionDetails, technique: e.target.value, brushwork: e.target.value }
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
                                                    value={editingItem.config?.viewpoint?.shotType || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, viewpoint: { ...editingItem.config?.viewpoint, shotType: e.target.value } }
                                                    })}
                                                    placeholder="ECU, Medium Shot, Wide..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Camera Angle</label>
                                                <NeuInput
                                                    value={editingItem.config?.viewpoint?.angle || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, viewpoint: { ...editingItem.config?.viewpoint, angle: e.target.value } }
                                                    })}
                                                    placeholder="Eye-Level, Low-Angle Hero..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Perspective / Lens</label>
                                                <NeuInput
                                                    value={editingItem.config?.viewpoint?.perspective || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, viewpoint: { ...editingItem.config?.viewpoint, perspective: e.target.value } }
                                                    })}
                                                    placeholder="50mm Standard, 135mm Telephoto..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Depth of Field</label>
                                                <NeuInput
                                                    value={editingItem.config?.viewpoint?.depthOfField || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, viewpoint: { ...editingItem.config?.viewpoint, depthOfField: e.target.value } }
                                                    })}
                                                    placeholder="Shallow f/2.8, Deep Focus..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Framing / Composition Rule</label>
                                                <NeuInput
                                                    value={editingItem.config?.viewpoint?.framingRule || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, viewpoint: { ...editingItem.config?.viewpoint, framingRule: e.target.value } }
                                                    })}
                                                    placeholder="Rule of Thirds, Centered, Golden Ratio..."
                                                    className="text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 3: BRAND APPLICATION (LOGO) */}
                                    <div className="space-y-2 pt-3 border-t border-purple-500/10">
                                        <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">3. Logo / Brand Application</h5>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Integration Method</label>
                                                <NeuInput
                                                    value={editingItem.config?.brandApplication?.integrationMethod || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, brandApplication: { ...editingItem.config?.brandApplication, integrationMethod: e.target.value } }
                                                    })}
                                                    placeholder="Embossed, 3D Object, Neon Sign..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Logo Materiality</label>
                                                <NeuInput
                                                    value={editingItem.config?.brandApplication?.materiality || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, brandApplication: { ...editingItem.config?.brandApplication, materiality: e.target.value } }
                                                    })}
                                                    placeholder="Gold Foil, Polished Chrome, Neon..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Lighting Interaction</label>
                                                <NeuInput
                                                    value={editingItem.config?.brandApplication?.lightingInteraction || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, brandApplication: { ...editingItem.config?.brandApplication, lightingInteraction: e.target.value } }
                                                    })}
                                                    placeholder="Standard, Backlit, Glowing..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Prominence</label>
                                                <NeuInput
                                                    value={editingItem.config?.brandApplication?.prominence || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, brandApplication: { ...editingItem.config?.brandApplication, prominence: e.target.value } }
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
                                                    value={editingItem.config?.lighting?.style || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, lighting: { ...editingItem.config?.lighting, style: e.target.value } }
                                                    })}
                                                    placeholder="Rembrandt, Split, High-Key..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Quality</label>
                                                <NeuInput
                                                    value={editingItem.config?.lighting?.quality || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, lighting: { ...editingItem.config?.lighting, quality: e.target.value } }
                                                    })}
                                                    placeholder="Soft Diffused, Hard Specular..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Contrast</label>
                                                <NeuInput
                                                    value={editingItem.config?.lighting?.contrast || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, lighting: { ...editingItem.config?.lighting, contrast: e.target.value } }
                                                    })}
                                                    placeholder="Flat, Medium, Dramatic 4:1..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Color Temperature</label>
                                                <NeuInput
                                                    value={editingItem.config?.lighting?.temperature || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, lighting: { ...editingItem.config?.lighting, temperature: e.target.value } }
                                                    })}
                                                    placeholder="5600K Daylight, 2700K Warm..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Atmospherics</label>
                                                <NeuInput
                                                    value={editingItem.config?.lighting?.atmospherics || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, lighting: { ...editingItem.config?.lighting, atmospherics: e.target.value } }
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
                                                    value={editingItem.config?.aesthetics?.colorGrade || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, aesthetics: { ...editingItem.config?.aesthetics, colorGrade: e.target.value } }
                                                    })}
                                                    placeholder="Teal & Orange, Vintage Film..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Clarity / Sharpness</label>
                                                <NeuInput
                                                    value={editingItem.config?.aesthetics?.clarity || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, aesthetics: { ...editingItem.config?.aesthetics, clarity: e.target.value } }
                                                    })}
                                                    placeholder="Soft Dreamy, Crisp High..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Texture Overlay</label>
                                                <NeuInput
                                                    value={editingItem.config?.aesthetics?.textureOverlay || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, aesthetics: { ...editingItem.config?.aesthetics, textureOverlay: e.target.value } }
                                                    })}
                                                    placeholder="None, Fine Grain, Halftone..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[9px] ${styles.textSub} block mb-0.5`}>Surface Material</label>
                                                <NeuInput
                                                    value={editingItem.config?.aesthetics?.primarySurfaceMaterial || ''}
                                                    onChange={(e) => setEditingItem({
                                                        ...editingItem,
                                                        config: { ...DEFAULT_V2_CONFIG, ...editingItem.config, aesthetics: { ...editingItem.config?.aesthetics, primarySurfaceMaterial: e.target.value } }
                                                    })}
                                                    placeholder="Matte, High-Gloss, Metallic..."
                                                    className="text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* JSON Editor (Collapsed) */}
                                    <details className="pt-3 border-t border-purple-500/10">
                                        <summary className="cursor-pointer text-[10px] font-bold text-gray-500 hover:text-gray-400 flex items-center gap-1 select-none">
                                            <ChevronDown size={12} /> JSON Editor (Paste AI-generated config)
                                        </summary>
                                        <div className="mt-2">
                                            <NeuTextArea
                                                value={JSON.stringify(editingItem.config || DEFAULT_V2_CONFIG, null, 2)}
                                                onChange={(e) => {
                                                    try {
                                                        const parsed = JSON.parse(e.target.value);
                                                        setEditingItem({ ...editingItem, config: parsed });
                                                    } catch { /* Invalid JSON */ }
                                                }}
                                                className="h-48 text-[10px] font-mono bg-black/30"
                                                placeholder="Paste V2 config JSON..."
                                            />
                                        </div>
                                    </details>
                                </div>

                                {/* Legacy Prompt Modifier (Collapsed) */}
                                <details className="mt-3">
                                    <summary className="cursor-pointer text-[9px] font-bold text-gray-500 hover:text-gray-400 flex items-center gap-1 select-none">
                                        <ChevronDown size={10} /> Legacy: Prompt Modifier (Fallback)
                                    </summary>
                                    <div className="mt-2">
                                        <NeuTextArea
                                            value={editingItem.promptModifier || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, promptModifier: e.target.value })}
                                            className="h-16 text-xs font-mono"
                                            placeholder="Legacy fallback if no V2 config..."
                                        />
                                    </div>
                                </details>


                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className={`text-xs font-bold ${styles.textSub} mb-2 block flex items-center gap-2`}>
                                            Style Assets (AI References)
                                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[9px] uppercase">Crucial</span>
                                        </label>

                                        <div className="grid grid-cols-4 gap-2">
                                            {/* Existing Images */}
                                            {(editingItem.referenceImages || []).map((refImg: any, idx: number) => {
                                                // Handle legacy string array if somehow still present in state before refresh
                                                const url = typeof refImg === 'string' ? refImg : refImg.url;
                                                const isActive = typeof refImg === 'string' ? true : refImg.isActive;
                                                const id = typeof refImg === 'string' ? url : refImg.id;

                                                const isThumbnail = url === editingItem.imageUrl;

                                                return (
                                                    <div key={id || idx}
                                                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${isThumbnail ? 'border-brand ring-2 ring-brand/20' : 'border-transparent hover:border-white/20'} ${!isActive ? 'opacity-50 grayscale' : ''} `}
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
                                                                        const newRefs = [...(editingItem.referenceImages || [])];
                                                                        if (idx > 0) {
                                                                            [newRefs[idx - 1], newRefs[idx]] = [newRefs[idx], newRefs[idx - 1]];
                                                                            setEditingItem({ ...editingItem, referenceImages: newRefs });
                                                                        }
                                                                    }}
                                                                    className="p-1 text-white hover:text-brand disabled:opacity-30"
                                                                >
                                                                    &lt;
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={idx === (editingItem.referenceImages?.length || 0) - 1}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newRefs = [...(editingItem.referenceImages || [])];
                                                                        if (idx < newRefs.length - 1) {
                                                                            [newRefs[idx], newRefs[idx + 1]] = [newRefs[idx + 1], newRefs[idx]];
                                                                            setEditingItem({ ...editingItem, referenceImages: newRefs });
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
                                                                        const newRefs = [...(editingItem.referenceImages || [])];
                                                                        // Ensure object structure
                                                                        if (typeof newRefs[idx] === 'string') {
                                                                            newRefs[idx] = { id: newRefs[idx], url: newRefs[idx], isActive: false };
                                                                        } else {
                                                                            newRefs[idx] = { ...newRefs[idx], isActive: !newRefs[idx].isActive };
                                                                        }
                                                                        setEditingItem({ ...editingItem, referenceImages: newRefs });
                                                                    }}
                                                                    className={`p-1 rounded-full ${isActive ? 'text-green-400' : 'text-gray-400'}`}
                                                                    title={isActive ? "Disable" : "Enable"}
                                                                >
                                                                    {isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingItem({ ...editingItem, imageUrl: url })}
                                                                    className={`px-2 py-0.5 rounded text-[8px] font-bold backdrop-blur-md transition-all ${isThumbnail
                                                                        ? 'bg-brand text-white'
                                                                        : 'bg-white/20 text-white hover:bg-white/40'
                                                                        } `}
                                                                >
                                                                    {isThumbnail ? 'Cover' : 'Set Cover'}
                                                                </button>
                                                            </div>

                                                            {/* Bottom: Delete */}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newRefs = [...(editingItem.referenceImages || [])];
                                                                    newRefs.splice(idx, 1);
                                                                    // If deleting the thumbnail, clear it
                                                                    const updates: any = { referenceImages: newRefs };
                                                                    if (isThumbnail) updates.imageUrl = '';
                                                                    setEditingItem({ ...editingItem, ...updates });
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
                                                    // Convert to StyleReferenceImage objects
                                                    const newObjs = newUrls.map(u => ({
                                                        id: crypto.randomUUID(),
                                                        url: u,
                                                        isActive: true
                                                    }));

                                                    const currentRefs = editingItem.referenceImages || [];
                                                    const updatedRefs = [...currentRefs, ...newObjs];

                                                    // If no cover image exists, set the first new one as cover
                                                    const updates: any = { referenceImages: updatedRefs };
                                                    if (!editingItem.imageUrl && newUrls.length > 0) {
                                                        updates.imageUrl = newUrls[0];
                                                    }

                                                    setEditingItem({ ...editingItem, ...updates });
                                                }}
                                                currentValue="" // Always empty for "add more" mode
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <NeuButton type="button" variant="primary" className="w-full mt-4 h-12" onClick={handleSaveConfigItem}>
                                <Save size={18} /> Save Changes
                            </NeuButton>

                        </div>
                    ) : (
                        <div className={`h-full flex flex-col items-center justify-center opacity-30 ${styles.textSub} min-h-[400px]`}>
                            <Settings size={64} strokeWidth={1} />
                            <p className="mt-4 font-bold">Style Studio</p>
                            <p className="text-xs">Select a style to edit or create a new one.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
