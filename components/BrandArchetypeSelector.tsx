import React from 'react';
import { BrandArchetype } from '../types';
import { NeuCard, useThemeStyles } from './NeuComponents';
import { Sparkles, Zap, Heart, Shield, Crown, Coffee, Smile, Globe, BookOpen, PenTool, Gavel, Flame } from 'lucide-react';

interface BrandArchetypeSelectorProps {
    value: BrandArchetype;
    onChange: (value: BrandArchetype) => void;
}

const ARCHETYPES: { id: BrandArchetype; icon: any; label: string; desc: string; color: string }[] = [
    { id: 'The Innocent', icon: Smile, label: 'The Innocent', desc: 'Optimistic, honest, humble.', color: 'text-yellow-400' },
    { id: 'The Explorer', icon: Globe, label: 'The Explorer', desc: 'Independent, ambitious, authentic.', color: 'text-green-500' },
    { id: 'The Sage', icon: BookOpen, label: 'The Sage', desc: 'Wise, visionary, articulate.', color: 'text-blue-400' },
    { id: 'The Hero', icon: Zap, label: 'The Hero', desc: 'Brave, bold, honorable.', color: 'text-orange-500' },
    { id: 'The Outlaw', icon: Flame, label: 'The Outlaw', desc: 'Rebellious, disruptive, shock value.', color: 'text-red-500' },
    { id: 'The Magician', icon: Sparkles, label: 'The Magician', desc: 'Visionary, charismatic, imaginative.', color: 'text-purple-500' },
    { id: 'The Guy/Girl Next Door', icon: Coffee, label: 'The Regular', desc: 'Down-to-earth, supportive, accessible.', color: 'text-amber-700' },
    { id: 'The Lover', icon: Heart, label: 'The Lover', desc: 'Passionate, intimate, romantic.', color: 'text-pink-500' },
    { id: 'The Jester', icon: Smile, label: 'The Jester', desc: 'Fun, light-hearted, mischievous.', color: 'text-yellow-500' },
    { id: 'The Caregiver', icon: Shield, label: 'The Caregiver', desc: 'Compassionate, nurturing, generous.', color: 'text-teal-500' },
    { id: 'The Creator', icon: PenTool, label: 'The Creator', desc: 'Innovative, artistic, perfectionist.', color: 'text-indigo-500' },
    { id: 'The Ruler', icon: Crown, label: 'The Ruler', desc: 'Controlling, authoritative, responsible.', color: 'text-gray-500' },
];

export const BrandArchetypeSelector: React.FC<BrandArchetypeSelectorProps> = ({ value, onChange }) => {
    const { styles } = useThemeStyles();

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ARCHETYPES.map((arch) => {
                const isSelected = value === arch.id;
                const Icon = arch.icon;

                return (
                    <button
                        key={arch.id}
                        onClick={() => onChange(arch.id)}
                        className={`relative p-4 rounded-xl text-left transition-all duration-300 group
              ${isSelected
                                ? `${styles.bg} ${styles.shadowIn} ring-2 ring-brand ring-offset-2 ring-offset-transparent`
                                : `${styles.bg} ${styles.shadowOut} hover:scale-[1.02]`
                            }
            `}
                    >
                        <div className={`mb-3 p-2 rounded-lg inline-block ${isSelected ? 'bg-brand/10' : 'bg-gray-100 dark:bg-white/5'} ${arch.color}`}>
                            <Icon size={24} />
                        </div>
                        <h4 className={`font-bold text-sm mb-1 ${styles.textMain}`}>{arch.label}</h4>
                        <p className={`text-xs ${styles.textSub} leading-relaxed`}>{arch.desc}</p>

                        {isSelected && (
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand shadow-[0_0_10px_rgba(109,93,252,0.5)]" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
