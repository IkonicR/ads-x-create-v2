import React from 'react';
import { TypographySettings } from '../types';
import { NeuCard, NeuDropdown, useThemeStyles } from './NeuComponents';

interface TypographySelectorProps {
    value: TypographySettings;
    onChange: (value: TypographySettings) => void;
}

const HEADING_FONTS = [
    { label: '✨ Let AI Decide', value: '', type: 'auto' },
    { label: 'Playfair Display (Serif)', value: 'Playfair Display', type: 'serif' },
    { label: 'Montserrat (Sans)', value: 'Montserrat', type: 'sans-serif' },
    { label: 'Roboto Slab (Slab)', value: 'Roboto Slab', type: 'serif' },
    { label: 'Oswald (Display)', value: 'Oswald', type: 'sans-serif' },
    { label: 'Merriweather (Serif)', value: 'Merriweather', type: 'serif' },
    { label: 'Lato (Sans)', value: 'Lato', type: 'sans-serif' },
    { label: 'Poppins (Sans)', value: 'Poppins', type: 'sans-serif' },
    { label: 'Raleway (Sans)', value: 'Raleway', type: 'sans-serif' },
];

const BODY_FONTS = [
    { label: '✨ Let AI Decide', value: '', type: 'auto' },
    { label: 'Roboto', value: 'Roboto', type: 'sans-serif' },
    { label: 'Open Sans', value: 'Open Sans', type: 'sans-serif' },
    { label: 'Lato', value: 'Lato', type: 'sans-serif' },
    { label: 'Montserrat', value: 'Montserrat', type: 'sans-serif' },
    { label: 'Source Sans Pro', value: 'Source Sans Pro', type: 'sans-serif' },
    { label: 'Merriweather', value: 'Merriweather', type: 'serif' },
];

export const TypographySelector: React.FC<TypographySelectorProps> = ({ value, onChange }) => {
    const { styles } = useThemeStyles();

    // Helper to inject font link dynamically for preview
    React.useEffect(() => {
        const fonts = [value.headingFont, value.bodyFont].filter(Boolean);
        if (fonts.length === 0) return;

        const linkId = 'dynamic-font-preview';
        let link = document.getElementById(linkId) as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        const fontQuery = fonts.map(f => f.replace(/ /g, '+')).join('|');
        link.href = `https://fonts.googleapis.com/css?family=${fontQuery}&display=swap`;
    }, [value.headingFont, value.bodyFont]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
                <div>
                    <NeuDropdown
                        label="Heading Font"
                        placeholder="Select a font..."
                        value={value.headingFont}
                        options={HEADING_FONTS}
                        onChange={(val) => onChange({ ...value, headingFont: val })}
                    />
                </div>

                <div>
                    <NeuDropdown
                        label="Body Font"
                        placeholder="Select a font..."
                        value={value.bodyFont}
                        options={BODY_FONTS}
                        onChange={(val) => onChange({ ...value, bodyFont: val })}
                    />
                </div>
            </div>

            {/* Live Preview */}
            <div className={`p-6 rounded-xl ${styles.bgAccent} border ${styles.border} flex flex-col justify-center min-h-[200px]`}>
                <h3
                    className="text-3xl mb-4 leading-tight"
                    style={{ fontFamily: value.headingFont || 'inherit' }}
                >
                    {value.headingFont ? 'The Quick Brown Fox' : 'AI Will Choose The Best Font'}
                </h3>
                <p
                    className="text-sm opacity-80 leading-relaxed"
                    style={{ fontFamily: value.bodyFont || 'inherit' }}
                >
                    {value.bodyFont
                        ? "This is how your brand's typography will look in generated content. Good typography establishes hierarchy and readability."
                        : "If you leave this blank, our AI will analyze your brand vibe and select the perfect typography pairing for each piece of content."
                    }
                </p>
            </div>
        </div>
    );
};
