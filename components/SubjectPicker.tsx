import React, { useState } from 'react';
import { Business, Offering, TeamMember } from '../types';
import { NeuCard, NeuInput, useThemeStyles } from './NeuComponents';
import { NeuModal } from './NeuModal';
import { Search, ShoppingBag, Users, X, Check } from 'lucide-react';

interface SubjectPickerProps {
    business: Business;
    onSelect: (subject: { id: string; name: string; type: 'product' | 'person'; imageUrl?: string }) => void;
    onClose: () => void;
}

export const SubjectPicker: React.FC<SubjectPickerProps> = ({ business, onSelect, onClose }) => {
    const { styles } = useThemeStyles();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'product' | 'person'>('all');

    const getSubjects = () => {
        const products = business.offerings.map(o => ({
            id: o.id,
            name: o.name,
            type: 'product' as const,
            imageUrl: o.imageUrl,
            description: o.category
        }));

        const team = (business.teamMembers || []).map(t => ({
            id: t.id,
            name: t.name,
            type: 'person' as const,
            imageUrl: t.imageUrl,
            description: t.role
        }));

        let all = [...products, ...team];

        if (activeTab !== 'all') {
            all = all.filter(item => item.type === activeTab);
        }

        if (search) {
            const q = search.toLowerCase();
            all = all.filter(item =>
                item.name.toLowerCase().includes(q) ||
                (item.description && item.description.toLowerCase().includes(q))
            );
        }

        return all;
    };

    const subjects = getSubjects();

    return (
        <NeuModal
            isOpen={true}
            onClose={onClose}
            title="Select Subject"
            className="max-w-lg p-0 flex flex-col max-h-[80vh] overflow-hidden"
        >
            {/* Search & Tabs */}
            <div className="p-4 space-y-4">
                <div className="relative">
                    <Search className={`absolute left-3 top-3 ${styles.textSub}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search products or team..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-xl ${styles.bg} ${styles.shadowIn} ${styles.textMain} outline-none focus:ring-2 focus:ring-brand/20`}
                        autoFocus
                    />
                </div>

                <div className="flex gap-2">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'product', label: 'Products', icon: ShoppingBag },
                        { id: 'person', label: 'Team', icon: Users }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === tab.id
                                ? `${styles.bg} ${styles.shadowOut} text-brand`
                                : `${styles.textSub} hover:bg-black/5`
                                }`}
                        >
                            {tab.icon && <tab.icon size={12} />}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2 custom-scrollbar">
                {subjects.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-sm">No subjects found.</p>
                    </div>
                ) : (
                    subjects.map(subject => (
                        <button
                            key={subject.id}
                            onClick={() => onSelect(subject)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/5 text-left group border border-transparent hover:border-brand/10`}
                        >
                            <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 ${styles.shadowOut} bg-gray-100 flex items-center justify-center`}>
                                {subject.imageUrl ? (
                                    <img src={subject.imageUrl} alt={subject.name} className="w-full h-full object-cover" />
                                ) : (
                                    subject.type === 'product' ? <ShoppingBag size={16} className="text-gray-400" /> : <Users size={16} className="text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold ${styles.textMain} truncate`}>{subject.name}</div>
                                <div className={`text-xs ${styles.textSub} truncate`}>{subject.description}</div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 text-brand">
                                <Check size={18} />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </NeuModal>
    );
};
