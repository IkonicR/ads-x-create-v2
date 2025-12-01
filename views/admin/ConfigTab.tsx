import React, { useState } from 'react';
import { StylePreset } from '../../types';
import { NeuButton, NeuInput, NeuTextArea } from '../../components/NeuComponents';
import { Palette, Plus, Trash2, Save, Settings, CheckCircle2, XCircle, Copy, FileJson, Clipboard } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface ConfigTabProps {
    stylesList: StylePreset[];
    setStylesList: (val: StylePreset[]) => void;
    styles: any;
    handleRefresh: () => Promise<void>;
}

const TEMPLATE_STYLE = {
    name: "New Style Name",
    description: "Short description for the UI",
    promptModifier: "Detailed visual description for the AI...",
    imageUrl: "",
    logoMaterial: "Matte Print",
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
        const { id, ...cleanItem } = editingItem; // Exclude ID to avoid conflicts if copied to new
        navigator.clipboard.writeText(JSON.stringify(cleanItem, null, 2));
        alert("Style JSON copied to clipboard!");
    };

    const handleCopyTemplate = () => {
        navigator.clipboard.writeText(JSON.stringify(TEMPLATE_STYLE, null, 2));
        alert("Template JSON copied to clipboard!");
    };

    const handlePasteJSON = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const json = JSON.parse(text);

            // Basic validation
            if (!json.name || !json.promptModifier) {
                throw new Error("Invalid JSON: Missing name or promptModifier");
            }

            // Merge with current ID (keep the ID of the item being edited)
            setEditingItem({
                ...editingItem,
                ...json,
                id: editingItem.id // Ensure ID doesn't change
            });
            alert("Style updated from JSON!");
        } catch (e) {
            alert("Failed to paste JSON. Check format.");
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

                    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar pr-2 p-2 pb-4">
                        {/* VISUAL GRID FOR STYLES (Compact) */}
                        <div className="grid grid-cols-1 gap-3">
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

                                {/* Style Specifics */}
                                <div>
                                    <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Logo Behavior (Material/Integration)</label>
                                    <NeuInput
                                        value={editingItem.logoMaterial || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, logoMaterial: e.target.value })}
                                        placeholder="e.g. Glowing Neon, Gold Foil, Matte Print..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className={`text-xs font-bold ${styles.textSub} mb-2 block flex items-center gap-2`}>
                                            Style Assets (AI References)
                                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[9px] uppercase">Crucial</span>
                                        </label>

                                        <div className="grid grid-cols-4 gap-2">
                                            {/* Existing Images */}
                                            {(editingItem.referenceImages || []).map((url: string, idx: number) => {
                                                const isThumbnail = url === editingItem.imageUrl;
                                                return (
                                                    <div key={idx}
                                                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${isThumbnail ? 'border-brand ring-2 ring-brand/20' : 'border-transparent hover:border-white/20'} `}
                                                    >
                                                        <img src={url} className="w-full h-full object-cover" />

                                                        {/* Actions Overlay */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setEditingItem({ ...editingItem, imageUrl: url })}
                                                                className={`px-2 py-1 rounded-full text-[9px] font-bold backdrop-blur-md transition-all ${isThumbnail
                                                                    ? 'bg-brand text-white'
                                                                    : 'bg-white/20 text-white hover:bg-white/40'
                                                                    } `}
                                                            >
                                                                {isThumbnail ? 'Cover Image' : 'Make Cover'}
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    const newRefs = [...(editingItem.referenceImages || [])];
                                                                    newRefs.splice(idx, 1);
                                                                    // If deleting the thumbnail, clear it
                                                                    const updates: any = { referenceImages: newRefs };
                                                                    if (isThumbnail) updates.imageUrl = '';
                                                                    setEditingItem({ ...editingItem, ...updates });
                                                                }}
                                                                className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-500"
                                                                title="Remove Asset"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
