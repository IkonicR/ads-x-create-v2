import React, { useState, useMemo } from 'react';
import { Business, Asset, StylePreset, LinkedEntity } from '../types';
import { NeuInput, useThemeStyles } from './NeuComponents';
import { Search, X, LayoutTemplate, Palette, Building2, Image as ImageIcon, Plus } from 'lucide-react';

interface LinkPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (entity: LinkedEntity) => void;
    businesses: Business[];
    stylesList: StylePreset[];
}

export const LinkPicker: React.FC<LinkPickerProps> = ({
    isOpen,
    onClose,
    onSelect,
    businesses,
    stylesList
}) => {
    const { styles } = useThemeStyles();
    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState<'all' | 'style' | 'business'>('all');

    const filteredItems = useMemo(() => {
        let items: LinkedEntity[] = [];

        // Convert all to LinkedEntity format
        if (activeType === 'all' || activeType === 'business') {
            items.push(...businesses.map(b => ({
                id: b.id,
                type: 'business' as const,
                name: b.name,
                previewUrl: b.logoUrl
            })));
        }
        if (activeType === 'all' || activeType === 'style') {
            items.push(...stylesList.map(s => ({
                id: s.id,
                type: 'style' as const,
                name: s.name,
                previewUrl: s.imageUrl
            })));
        }

        return items.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [businesses, stylesList, search, activeType]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg rounded-2xl ${styles.bg} ${styles.shadowOut} overflow-hidden flex flex-col max-h-[80vh]`}>
                <div className="p-4 border-b border-gray-200/10 flex justify-between items-center">
                    <h3 className={`font-bold ${styles.textMain}`}>Attach Link</h3>
                    <button onClick={onClose} className={`${styles.textSub} hover:text-red-400`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${styles.textSub}`} />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-xl bg-transparent border-2 border-gray-200/10 focus:border-brand outline-none ${styles.textMain}`}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'business', label: 'Businesses', icon: Building2 },
                            { id: 'style', label: 'Styles', icon: Palette },
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setActiveType(type.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeType === type.id
                                        ? `${styles.bg} ${styles.shadowIn} text-brand`
                                        : `${styles.bg} ${styles.shadowOut} ${styles.textSub}`
                                    }`}
                            >
                                {type.icon && <type.icon size={12} />}
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                    {filteredItems.length === 0 ? (
                        <div className={`text-center py-8 ${styles.textSub} opacity-50`}>
                            No items found
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => onSelect(item)}
                                className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group`}
                            >
                                <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ${styles.bg} ${styles.shadowIn} flex items-center justify-center`}>
                                    {item.previewUrl ? (
                                        <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={styles.textSub}>
                                            {item.type === 'business' && <Building2 size={16} />}
                                            {item.type === 'style' && <Palette size={16} />}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-bold text-sm ${styles.textMain} truncate`}>{item.name}</div>
                                    <div className={`text-[10px] uppercase font-bold ${styles.textSub} opacity-60`}>{item.type}</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={16} className="text-brand" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
