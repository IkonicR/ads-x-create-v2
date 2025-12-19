/**
 * ExtractionPreview Component
 * Shows extracted business data for user verification and editing
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    NeuCard, NeuButton, NeuInput, NeuTextArea, NeuDropdown,
    useThemeStyles
} from './NeuComponents';
import { GalaxyHeading } from './GalaxyHeading';
import { ExtractionResult, ExtractedBusinessData } from '../services/extractionService';
import {
    Check, Pencil, Building, Palette, Phone, MessageSquare,
    ShoppingBag, Sparkles, ChevronDown, ChevronUp, AlertCircle, Image
} from 'lucide-react';

interface ExtractionPreviewProps {
    result: ExtractionResult;
    onConfirm: (data: ExtractedBusinessData) => void;
    onBack: () => void;
}

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    confidence?: number;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

const Section: React.FC<SectionProps> = ({
    title, icon, confidence, children, defaultExpanded = true
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const { styles } = useThemeStyles();

    const confidenceColor = confidence
        ? confidence >= 0.8 ? 'text-green-500'
            : confidence >= 0.5 ? 'text-yellow-500'
                : 'text-orange-500'
        : '';

    return (
        <NeuCard className="overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className={`text-brand`}>{icon}</div>
                    <span className="font-bold">{title}</span>
                    {confidence !== undefined && (
                        <span className={`text-xs ${confidenceColor} flex items-center gap-1`}>
                            <Sparkles size={12} />
                            {Math.round(confidence * 100)}% confident
                        </span>
                    )}
                </div>
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                >
                    {children}
                </motion.div>
            )}
        </NeuCard>
    );
};

export const ExtractionPreview: React.FC<ExtractionPreviewProps> = ({
    result,
    onConfirm,
    onBack,
}) => {
    const { styles } = useThemeStyles();
    const [editedData, setEditedData] = useState<ExtractedBusinessData>(
        result.data || {}
    );

    // Sync editedData when result.data changes (fixes logo not displaying)
    useEffect(() => {
        if (result.data) {
            setEditedData(result.data);
        }
    }, [result.data]);

    // Log extracted data for debugging
    useEffect(() => {
        console.log('=== EXTRACTION PREVIEW DATA ===');
        console.log('Raw result:', result);
        console.log('Extracted data:', result.data);
        console.log('Logo URL:', result.data?.logoUrl);
        console.log('Profile:', result.data?.profile);
        console.log('Offerings:', result.data?.offerings);
        console.log('Confidence:', result.confidence);
        console.log('================================');
    }, [result]);

    const updateField = <K extends keyof ExtractedBusinessData>(
        key: K,
        value: ExtractedBusinessData[K]
    ) => {
        setEditedData(prev => ({ ...prev, [key]: value }));
    };

    const updateNestedField = <
        K extends keyof ExtractedBusinessData,
        NK extends keyof NonNullable<ExtractedBusinessData[K]>
    >(
        key: K,
        nestedKey: NK,
        value: any
    ) => {
        setEditedData(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] as any || {}),
                [nestedKey]: value,
            },
        }));
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Header with Optional Logo */}
            <div className="text-center mb-8">
                {/* Logo Display */}
                {editedData.logoUrl && (
                    <div className="mb-6 flex justify-center">
                        <div className={`p-4 rounded-2xl ${styles.bg} ${styles.shadowOut} inline-block`}>
                            <img
                                src={editedData.logoUrl}
                                alt="Business Logo"
                                className="h-16 max-w-[200px] object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-center gap-3 mb-2">
                    <GalaxyHeading text="Review Your Profile" className="text-3xl md:text-4xl" />
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-600 border border-blue-200 uppercase tracking-wide shadow-sm transform -translate-y-1">
                        Beta
                    </span>
                </div>
                <p className={`${styles.textSub} mt-2 max-w-md mx-auto`}>
                    We extracted this from your website. Review and adjust as needed.
                </p>
                {!editedData.logoUrl && (
                    <p className={`${styles.textSub} text-xs mt-2 opacity-60`}>
                        No logo detected • You can add one later in Brand Kit
                    </p>
                )}
            </div>

            {/* Identity Section */}
            <Section
                title="Business Identity"
                icon={<Building size={20} />}
                confidence={result.confidence?.identity}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Business Name
                            </label>
                            <NeuInput
                                value={editedData.name || ''}
                                onChange={e => updateField('name', e.target.value)}
                                placeholder="Your business name"
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Industry
                            </label>
                            <NeuInput
                                value={editedData.industry || ''}
                                onChange={e => updateField('industry', e.target.value)}
                                placeholder="e.g. Restaurant, Fashion, Tech"
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                            Description
                        </label>
                        <NeuTextArea
                            expandable
                            value={editedData.description || ''}
                            onChange={e => updateField('description', e.target.value)}
                            placeholder="Brief description of your business"
                            rows={3}
                        />
                    </div>

                    {editedData.slogan && (
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Slogan / Tagline
                            </label>
                            <NeuInput
                                value={editedData.slogan || ''}
                                onChange={e => updateField('slogan', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </Section>

            {/* Brand Colors Section */}
            <Section
                title="Brand Colors"
                icon={<Palette size={20} />}
                confidence={result.confidence?.branding}
            >
                <div className="flex flex-wrap gap-4">
                    {(['primary', 'secondary', 'accent'] as const).map(colorKey => {
                        const color = editedData.colors?.[colorKey];
                        return (
                            <div key={colorKey} className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-inner cursor-pointer"
                                    style={{ backgroundColor: color || '#cccccc' }}
                                    onClick={() => {
                                        // Could open a color picker here
                                    }}
                                />
                                <div>
                                    <div className="text-xs font-bold capitalize">{colorKey}</div>
                                    <input
                                        type="text"
                                        value={color || ''}
                                        onChange={e => updateNestedField('colors', colorKey, e.target.value)}
                                        className={`text-xs ${styles.textSub} bg-transparent border-none outline-none w-20`}
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* Contact Info Section */}
            <Section
                title="Contact Information"
                icon={<Phone size={20} />}
                confidence={result.confidence?.contact}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Email
                            </label>
                            <NeuInput
                                type="email"
                                value={editedData.profile?.contactEmail || ''}
                                onChange={e => updateNestedField('profile', 'contactEmail', e.target.value)}
                                placeholder="contact@yourbusiness.com"
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Phone
                            </label>
                            <NeuInput
                                type="tel"
                                value={editedData.profile?.contactPhone || ''}
                                onChange={e => updateNestedField('profile', 'contactPhone', e.target.value)}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                            Address
                        </label>
                        <NeuInput
                            value={editedData.profile?.address || ''}
                            onChange={e => updateNestedField('profile', 'address', e.target.value)}
                            placeholder="123 Main Street, City, State"
                        />
                    </div>

                    {/* Social handles */}
                    {editedData.profile?.socials && editedData.profile.socials.length > 0 && (
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Social Media
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {editedData.profile.socials.map((social, idx) => (
                                    <span
                                        key={idx}
                                        className={`text-xs px-3 py-1 rounded-full ${styles.bg} ${styles.shadowOut}`}
                                    >
                                        {social.platform}: {social.handle}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Section>

            {/* Brand Voice Section */}
            <Section
                title="Brand Voice"
                icon={<MessageSquare size={20} />}
                confidence={result.confidence?.voice}
                defaultExpanded={false}
            >
                <div className="space-y-4">
                    {editedData.voice?.archetypeInferred && (
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Brand Archetype (AI Suggested)
                            </label>
                            <div className={`text-sm p-3 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
                                {editedData.voice.archetypeInferred}
                            </div>
                        </div>
                    )}

                    {editedData.voice?.tonePillsInferred && editedData.voice.tonePillsInferred.length > 0 && (
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Tone (AI Suggested)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {editedData.voice.tonePillsInferred.map((pill, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs px-3 py-1 rounded-full bg-brand/20 text-brand"
                                    >
                                        {pill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {editedData.voice?.keywords && editedData.voice.keywords.length > 0 && (
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${styles.textSub} uppercase`}>
                                Brand Keywords
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {editedData.voice.keywords.map((keyword, idx) => (
                                    <span
                                        key={idx}
                                        className={`text-xs px-3 py-1 rounded-full ${styles.bg} ${styles.shadowOut}`}
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Section>

            {/* Offerings Section */}
            {editedData.offerings && editedData.offerings.length > 0 && (
                <Section
                    title={`Products/Services (${editedData.offerings.length} found)`}
                    icon={<ShoppingBag size={20} />}
                    confidence={result.confidence?.offerings}
                    defaultExpanded={false}
                >
                    <div className="space-y-3">
                        {editedData.offerings.slice(0, 5).map((offering, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-xl ${styles.bg} ${styles.shadowIn}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate">{offering.name}</div>
                                        {offering.description && (
                                            <div className={`text-xs ${styles.textSub} mt-1 line-clamp-2`}>
                                                {offering.description}
                                            </div>
                                        )}
                                        {offering.category && (
                                            <div className={`text-xs ${styles.textSub} opacity-60 mt-1`}>
                                                {offering.category}
                                            </div>
                                        )}
                                    </div>
                                    {offering.price && (
                                        <div className="text-sm font-bold text-brand whitespace-nowrap">
                                            {offering.price}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {editedData.offerings.length > 5 && (
                            <p className={`text-xs ${styles.textSub} text-center`}>
                                +{editedData.offerings.length - 5} more (will be imported)
                            </p>
                        )}
                    </div>
                </Section>
            )}

            {/* Info Banner */}
            <div className={`flex items-start gap-3 p-4 rounded-xl ${styles.bg} ${styles.shadowIn} text-sm`}>
                <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <p className={styles.textSub}>
                    Don't worry if something's missing or incorrect – you can always edit this later
                    in your Business Profile and Brand Kit.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
                <NeuButton onClick={onBack} className="px-6">
                    ← Back
                </NeuButton>
                <NeuButton
                    variant="primary"
                    onClick={() => onConfirm(editedData)}
                    className="px-8"
                >
                    <Check size={18} /> Looks Good, Continue
                </NeuButton>
            </div>
        </div>
    );
};

export default ExtractionPreview;
