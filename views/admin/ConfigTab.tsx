import React, { useState, useEffect } from 'react';
import { StylePreset } from '../../types';
import { NeuButton, useThemeStyles } from '../../components/NeuComponents';
import { Palette, Plus, Settings } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { AnimatePresence } from 'framer-motion';
import { StyleEditorTabs } from '../../components/admin/StyleEditorTabs';

interface ConfigTabProps {
    stylesList: StylePreset[];
    setStylesList: (val: StylePreset[]) => void;
    styles: ReturnType<typeof useThemeStyles>['styles'];
    handleRefresh: () => Promise<void>;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({ stylesList, setStylesList, styles, handleRefresh }) => {
    const [editingItem, setEditingItem] = useState<StylePreset | null>(null);

    // ─────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────
    const handleCreateNewConfig = () => {
        const newStyle: StylePreset = {
            id: crypto.randomUUID(),
            name: 'New Style',
            description: '',
            promptModifier: '',
            sortOrder: stylesList.length * 10,
            isActive: true,
            imageUrl: '',
            styleCues: [],
            avoid: [],
            config: undefined
        };
        setEditingItem(newStyle);
    };

    const handleSaveConfigItem = async () => {
        if (!editingItem) return;
        await StorageService.saveStyle(editingItem as any);
        const updated = await StorageService.getStyles();
        setStylesList(updated);
        setEditingItem(null);
        await handleRefresh();
    };

    const handleDeleteItem = async () => {
        if (!editingItem) return;
        if (window.confirm('Are you sure you want to delete this style?')) {
            await StorageService.deleteStyle(editingItem.id);
            const updated = await StorageService.getStyles();
            setStylesList(updated);
            setEditingItem(null);
            await handleRefresh();
        }
    };

    // Close editor on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && editingItem) {
                setEditingItem(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [editingItem]);

    // ─────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-fade-in">
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Palette size={24} className="text-brand" />
                    <div>
                        <h3 className={`text-xl font-bold ${styles.textMain}`}>Style Studio</h3>
                        <p className={`text-xs ${styles.textSub}`}>Manage visual styles for AI generation</p>
                    </div>
                </div>
                <NeuButton type="button" variant="primary" onClick={handleCreateNewConfig} className="px-4 py-2">
                    <Plus size={16} /> New Style
                </NeuButton>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* GALLERY GRID (Full Width) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {stylesList.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-20 opacity-30 ${styles.textSub}`}>
                    <Settings size={64} strokeWidth={1} />
                    <p className="mt-4 font-bold">No Styles Yet</p>
                    <p className="text-xs">Create your first visual style to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {stylesList
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map((item) => {
                            const isSelected = editingItem?.id === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setEditingItem(isSelected ? null : item)}
                                    className={`group relative aspect-[16/10] rounded-xl overflow-hidden text-left transition-all ${isSelected
                                        ? `ring-2 ring-brand ${styles.shadowIn}`
                                        : `${styles.shadowOut} hover:ring-2 hover:ring-white/20`
                                        }`}
                                >
                                    {/* Image */}
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className={`w-full h-full ${styles.bg} flex items-center justify-center`}>
                                            <Palette className="text-gray-400" size={32} />
                                        </div>
                                    )}

                                    {/* Inactive badge - only show if explicitly set to false */}
                                    {item.isActive === false && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500/80 text-white text-[9px] font-bold rounded uppercase">
                                            Inactive
                                        </div>
                                    )}


                                    {/* Title overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                        <span className="text-white font-bold text-sm truncate block">{item.name}</span>
                                        {item.description && (
                                            <span className="text-white/60 text-[10px] truncate block">{item.description}</span>
                                        )}
                                    </div>

                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-brand/10 pointer-events-none" />
                                    )}
                                </button>
                            );
                        })}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* INLINE EDITOR (Expands below gallery) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {editingItem && (
                    <StyleEditorTabs
                        item={editingItem}
                        onChange={setEditingItem}
                        onSave={handleSaveConfigItem}
                        onDelete={handleDeleteItem}
                        onClose={() => setEditingItem(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
