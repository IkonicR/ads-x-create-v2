import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GalaxyHeading } from '../../components/GalaxyHeading';
import { useTheme } from '../../context/ThemeContext';
import {
    NeuCard,
    NeuButton,
    NeuInput,
    NeuTextArea,
    NeuBadge,
    NeuListBuilder,
    NeuDropdown,
    BRAND_COLOR,
    useThemeStyles
} from '../../components/NeuComponents';
import { Zap, Check, X } from 'lucide-react';

const ColorSwatch = ({ color, name, hex }: { color: string, name: string, hex?: string }) => (
    <div className="flex flex-col gap-2">
        <div className={`w-full h-24 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 ${color}`}></div>
        <div className="flex flex-col">
            <span className="font-bold text-sm">{name}</span>
            {hex && <span className="text-xs opacity-50 font-mono">{hex}</span>}
        </div>
    </div>
);

// Google Sans Flex Variable Font Showcase
const GoogleSansFlexShowcase: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const [weight, setWeight] = useState(400);
    const [width, setWidth] = useState(100);
    const [slant, setSlant] = useState(0);

    const fontStyle = {
        fontFamily: "'Google Sans Flex', sans-serif",
        fontWeight: weight,
        fontStretch: `${width}%`,
        fontStyle: slant !== 0 ? 'oblique' : 'normal',
        fontVariationSettings: `'wght' ${weight}, 'wdth' ${width}, 'slnt' ${slant}`
    };

    return (
        <section className="space-y-8">
            <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">
                07. Google Sans Flex (Variable Font)
            </h2>
            <p className="opacity-70">
                A flexible variable font from Google with multiple axes. Perfect for dynamic, expressive typography.
            </p>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-mono opacity-50">Weight: {weight}</label>
                    <input
                        type="range"
                        min="100"
                        max="900"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full accent-brand"
                    />
                    <div className="flex justify-between text-xs opacity-40 font-mono">
                        <span>Thin (100)</span>
                        <span>Black (900)</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-mono opacity-50">Width: {width}%</label>
                    <input
                        type="range"
                        min="75"
                        max="125"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-full accent-brand"
                    />
                    <div className="flex justify-between text-xs opacity-40 font-mono">
                        <span>Condensed (75)</span>
                        <span>Extended (125)</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-mono opacity-50">Slant: {slant}°</label>
                    <input
                        type="range"
                        min="-12"
                        max="0"
                        value={slant}
                        onChange={(e) => setSlant(Number(e.target.value))}
                        className="w-full accent-brand"
                    />
                    <div className="flex justify-between text-xs opacity-40 font-mono">
                        <span>Italic (-12)</span>
                        <span>Upright (0)</span>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className={`p-8 rounded-3xl ${isDark ? 'bg-neu-dark shadow-neu-in-dark' : 'bg-neu-light shadow-neu-in-light'}`}>
                <div className="space-y-6">
                    <h1 style={{ ...fontStyle, fontSize: '3rem' }} className="tracking-tight">
                        The Quick Brown Fox
                    </h1>
                    <h2 style={{ ...fontStyle, fontSize: '2rem' }}>
                        Jumps Over The Lazy Dog
                    </h2>
                    <p style={{ ...fontStyle, fontSize: '1.25rem' }} className="leading-relaxed max-w-2xl">
                        Google Sans Flex is a variable font with support for weight, width, and slant axes.
                        It's designed for flexible, modern interfaces that need typographic expression.
                    </p>
                    <p style={{ ...fontStyle, fontSize: '1rem' }} className="opacity-70">
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                    </p>
                </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Headlines', weight: 700, width: 100, slant: 0 },
                    { label: 'Body Text', weight: 400, width: 100, slant: 0 },
                    { label: 'Captions', weight: 300, width: 90, slant: 0 },
                    { label: 'Emphasis', weight: 600, width: 105, slant: -8 },
                ].map((preset) => (
                    <button
                        key={preset.label}
                        onClick={() => { setWeight(preset.weight); setWidth(preset.width); setSlant(preset.slant); }}
                        className={`p-4 rounded-xl text-left transition-all hover:scale-[0.98] ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                            }`}
                    >
                        <span
                            style={{
                                fontFamily: "'Google Sans Flex', sans-serif",
                                fontWeight: preset.weight,
                                fontStretch: `${preset.width}%`,
                                fontVariationSettings: `'wght' ${preset.weight}, 'wdth' ${preset.width}, 'slnt' ${preset.slant}`
                            }}
                            className="text-lg"
                        >
                            {preset.label}
                        </span>
                        <div className="text-xs opacity-40 font-mono mt-1">
                            wght:{preset.weight} wdth:{preset.width}
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
};

interface DesignLabTabProps {
    styles: ReturnType<typeof useThemeStyles>['styles'];
}

export const DesignLabTab: React.FC<DesignLabTabProps> = ({ styles }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [listItems, setListItems] = useState<string[]>(['Design', 'System', 'Rocks']);

    // Toggle state for Tactile Key experiments
    const [btn1Active, setBtn1Active] = useState(false);
    const [btn2Active, setBtn2Active] = useState(false);
    const [btn3Active, setBtn3Active] = useState(false);
    const [btn4Active, setBtn4Active] = useState(false);
    const [btn5Active, setBtn5Active] = useState(false);
    const [btn6Active, setBtn6Active] = useState(false);

    // Holding state (for deep press feedback)
    const [btn1Holding, setBtn1Holding] = useState(false);
    const [btn2Holding, setBtn2Holding] = useState(false);
    const [btn3Holding, setBtn3Holding] = useState(false);
    const [btn4Holding, setBtn4Holding] = useState(false);
    const [btn5Holding, setBtn5Holding] = useState(false);
    const [btn6Holding, setBtn6Holding] = useState(false);

    return (
        <div className="space-y-12">
            {/* --- HEADER --- */}
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <NeuBadge>Internal Tool</NeuBadge>
                    </div>
                    <GalaxyHeading text="DESIGN SYSTEM" className="text-3xl md:text-5xl" />
                    <p className={`mt-4 text-base max-w-2xl ${styles.textSub}`}>
                        The "Celestial Neumorphism" design language. Soft shadows, physical feel, and vibrant accents.
                    </p>
                </div>

                <button
                    onClick={toggleTheme}
                    className={`p-4 rounded-2xl transition-all hover:text-brand ${theme === 'dark' ? 'bg-neu-dark shadow-neu-out-dark' : 'bg-neu-light shadow-neu-out-light'}`}
                >
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
            </header>

            {/* --- COLORS --- */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2">01. Colors</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <ColorSwatch color="bg-brand" name="Brand Primary" hex={BRAND_COLOR} />
                    <ColorSwatch color="bg-[#5849C2]" name="Brand Hover" hex="#5849C2" />
                    <ColorSwatch color="bg-red-500" name="Danger" hex="#EF4444" />
                    <ColorSwatch color="bg-green-500" name="Success" hex="#22C55E" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
                    <ColorSwatch color="bg-neu-light" name="Light Bg" hex="#F9FAFB" />
                    <ColorSwatch color="bg-[#0F1115]" name="Dark Bg" hex="#0F1115" />
                    <ColorSwatch color="bg-white" name="Pure White" hex="#FFFFFF" />
                    <ColorSwatch color="bg-black" name="Pure Black" hex="#000000" />
                </div>
            </section>

            {/* --- TYPOGRAPHY --- */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2">02. Typography</h2>

                <div className={`space-y-8 p-8 rounded-3xl ${theme === 'dark' ? 'bg-neu-dark shadow-neu-in-dark' : 'bg-neu-light shadow-neu-in-light'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">H1 / GalaxyHeading</span>
                        <div className="md:col-span-2">
                            <GalaxyHeading text="The Quick Brown Fox" className="text-4xl" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">H2 / Bold</span>
                        <h2 className="text-3xl font-bold md:col-span-2">Jumps Over The Lazy Dog</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">H3 / Bold</span>
                        <h3 className="text-2xl font-bold md:col-span-2">Celestial UI Design</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">Body / Regular</span>
                        <p className={`md:col-span-2 leading-relaxed ${styles.textMain}`}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">Small / Medium</span>
                        <p className={`text-sm font-medium md:col-span-2 ${styles.textSub}`}>
                            Metadata, captions, and secondary information.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- COMPONENTS --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2">03. Components</h2>

                {/* Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold opacity-70">Buttons</h3>
                        <div className="flex flex-wrap gap-4">
                            <NeuButton variant="primary">Primary Action</NeuButton>
                            <NeuButton>Default</NeuButton>
                            <NeuButton variant="danger">Danger</NeuButton>
                            <NeuButton active>Active State</NeuButton>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4">
                            <NeuButton variant="primary" className="w-12 h-12 !p-0 rounded-full">
                                <Zap size={20} />
                            </NeuButton>
                            <NeuButton className="w-12 h-12 !p-0 rounded-full">
                                <Check size={20} />
                            </NeuButton>
                            <NeuButton variant="danger" className="w-12 h-12 !p-0 rounded-full">
                                <X size={20} />
                            </NeuButton>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold opacity-70">Badges</h3>
                        <div className="flex flex-wrap gap-3">
                            <NeuBadge>Default Badge</NeuBadge>
                            <NeuBadge className="text-green-500">Success</NeuBadge>
                            <NeuBadge className="text-red-500">Warning</NeuBadge>
                            <NeuBadge className="text-purple-500">Pro Feature</NeuBadge>
                        </div>
                    </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold opacity-70">Inputs</h3>
                        <NeuInput placeholder="Standard Input..." />
                        <NeuInput placeholder="With Icon..." />
                        <NeuDropdown
                            options={[
                                { label: 'Select Option 1', value: '1' },
                                { label: 'Select Option 2', value: '2' },
                                { label: 'Select Option 3', value: '3' },
                            ]}
                            onChange={(val) => console.log(val)}
                            placeholder="Choose an option..."
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold opacity-70">Text Area & Lists</h3>
                        <NeuTextArea placeholder="Multi-line text area..." rows={3} />
                        <NeuListBuilder
                            items={listItems}
                            onItemsChange={setListItems}
                            placeholder="Add a tag..."
                        />
                    </div>
                </div>

                {/* Cards */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold opacity-70">Cards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <NeuCard>
                            <h4 className="font-bold text-xl mb-2">Outset Card (Default)</h4>
                            <p className="opacity-70">
                                This is the standard card style used for content containers. It appears raised from the background.
                            </p>
                        </NeuCard>

                        <NeuCard inset>
                            <h4 className="font-bold text-xl mb-2">Inset Card</h4>
                            <p className="opacity-70">
                                This style is used for "wells", active states, or areas that should feel recessed or pressed in.
                            </p>
                        </NeuCard>
                    </div>
                </div>
            </section>

            {/* --- EXPERIMENTAL ROUND 4 (Dynamic Theme) --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">04. Experimental Shadows (Round 4)</h2>
                <p className="opacity-70">Testing "Old School Key" concepts. Toggle the Theme Switcher to see the difference.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* Option 1: The Plateau + Rim */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 1: "The Plateau" (With Rim)</h3>
                        <p className="text-xs opacity-50 font-mono">Sharp Outset + Sharp Inset Rim</p>
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)`
                                    : `3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)`
                            }}>
                            Plateau
                        </div>
                    </div>

                    {/* Option 2: The Bezel + Rim */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 2: "The Bezel" (With Rim)</h3>
                        <p className="text-xs opacity-50 font-mono">Border + Inner Shadow Definition</p>
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.5)',
                                boxShadow: isDark
                                    ? `6px 6px 12px #050608, -6px -6px 12px #16191e, inset 2px 2px 4px rgba(0, 0, 0, 0.5)`
                                    : `6px 6px 12px rgba(136, 158, 177, 0.3), -6px -6px 12px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(136, 158, 177, 0.1)`
                            }}>
                            Bezel
                        </div>
                    </div>

                    {/* Option 3: The Deep Plateau */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 3: "The Deep Plateau"</h3>
                        <p className="text-xs opacity-50 font-mono">Outer Plateau + Deep 10px Blur Dish</p>
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 p-3"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)`
                                    : `3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)`
                            }}>
                            <div className="w-full h-full rounded-xl flex items-center justify-center text-sm font-bold"
                                style={{
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `inset 5px 5px 10px rgba(0, 0, 0, 0.7), inset -5px -5px 10px rgba(255, 255, 255, 0.03)`
                                        : `inset 5px 5px 10px rgba(136, 158, 177, 0.3), inset -5px -5px 10px rgba(255, 255, 255, 0.8)`
                                }}>
                                Deep 10px
                            </div>
                        </div>
                    </div>

                    {/* Option 4: The Dish + Rim */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 4: "The Dish" (With Rim)</h3>
                        <p className="text-xs opacity-50 font-mono">Gradient + Deep Inner Shadow</p>
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                            style={{
                                background: isDark ? 'linear-gradient(145deg, #13161b, #0c0e11)' : 'linear-gradient(145deg, #ffffff, #eff1f5)',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `5px 5px 10px #050608, -5px -5px 10px #16191e, inset 0px 0px 0px 1px rgba(255,255,255,0.03), inset 2px 2px 5px rgba(0,0,0,0.5)`
                                    : `5px 5px 10px rgba(136, 158, 177, 0.35), -5px -5px 10px rgba(255, 255, 255, 1), inset 0px 0px 0px 1px rgba(255,255,255,0.5), inset 2px 2px 5px rgba(136, 158, 177, 0.1)`
                            }}>
                            Curved
                        </div>
                    </div>
                </div>
            </section>

            {/* --- EXPERIMENTAL ROUND 5 (Pure Inset) --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">05. Pure Inset Experiments</h2>
                <p className="opacity-70">Testing "Rotated Outset" concept — flipping the Plateau shadow 180° to create an inset illusion.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* The Canyon - Current Global Style */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-brand">Option 1: "The Canyon" ✓</h3>
                        <p className="text-xs opacity-50 font-mono">Current Global Inset Style</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `inset 6px 6px 4px rgba(0, 0, 0, 0.8), inset -6px -6px 4px rgba(255, 255, 255, 0.05)`
                                    : `inset 6px 6px 4px rgba(136, 158, 177, 0.6), inset -6px -6px 4px rgba(255, 255, 255, 1)`
                            }}>
                            Canyon
                        </div>
                    </div>

                    {/* The Rotated Plateau (180°) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 2: "Rotated Plateau" (180°)</h3>
                        <p className="text-xs opacity-50 font-mono">Outset shadow with flipped coordinates</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)`
                                    : `-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)`
                            }}>
                            Rotated 180°
                        </div>
                    </div>

                    {/* The Rotated Plateau (Deeper) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 3: "Rotated Plateau" (Deep)</h3>
                        <p className="text-xs opacity-50 font-mono">Deeper blur, more dramatic flip</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)`
                                    : `-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.25), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)`
                            }}>
                            Deep Rotated
                        </div>
                    </div>

                    {/* The Rotated Plateau (Soft) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 4: "Rotated Plateau" (Soft)</h3>
                        <p className="text-xs opacity-50 font-mono">More diffuse, gentler edges</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-3px -3px 6px #060709, 2px 2px 4px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.3)`
                                    : `-2px -2px 6px rgba(136, 158, 177, 0.3), 2px 2px 6px rgba(255, 255, 255, 1), -4px -4px 10px rgba(136, 158, 177, 0.15), inset -1px -1px 2px rgba(255, 255, 255, 0.8), inset 1px 1px 2px rgba(136, 158, 177, 0.2)`
                            }}>
                            Soft Rotated
                        </div>
                    </div>

                    {/* The Rotated Plateau (Sharp) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 5: "Rotated Plateau" (Sharp)</h3>
                        <p className="text-xs opacity-50 font-mono">Tighter blur, crisp definition</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-2px -2px 3px #060709, 2px 2px 3px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 1px rgba(0, 0, 0, 0.6)`
                                    : `-2px -2px 2px rgba(136, 158, 177, 0.5), 2px 2px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.4)`
                            }}>
                            Sharp Rotated
                        </div>
                    </div>

                    {/* The Rotated Plateau (No Rim) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 6: "Rotated Plateau" (No Rim)</h3>
                        <p className="text-xs opacity-50 font-mono">Pure outer shadow, no inset rim</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-4px -4px 8px #060709, 3px 3px 6px #181b21`
                                    : `-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2)`
                            }}>
                            No Rim
                        </div>
                    </div>
                </div>
            </section>

            {/* --- EXPERIMENTAL ROUND 6 (Tactile Key) --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">06. The Perfect Tactile Key</h2>
                <p className="opacity-70">Click to toggle pressed state. Click again to release. Test the feel!</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Option 1: Current (Fixed Toggle) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm text-brand">1. Current ✓</h4>
                        <motion.button
                            animate={btn1Active ? "pressed" : "initial"}
                            whileHover={!btn1Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn1Active(!btn1Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.975,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 1,
                                    scale: 0.95,
                                    boxShadow: isDark
                                        ? "-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 2,
                                    scale: 0.92,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.3), inset -2px -2px 3px rgba(255, 255, 255, 1), inset 2px 2px 3px rgba(136, 158, 177, 0.4)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeInOut", duration: 0.1 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn1Active ? 'Pressed' : 'Released'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            3-tier: hover → pressed → deep
                        </p>
                    </div>

                    {/* Option 2: Faster Response */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">2. Faster Response</h4>
                        <motion.button
                            animate={btn2Active ? "pressed" : "initial"}
                            whileHover={!btn2Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn2Active(!btn2Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.98,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 1,
                                    scale: 0.96,
                                    boxShadow: isDark
                                        ? "-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 2,
                                    scale: 0.92,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.3), inset -2px -2px 3px rgba(255, 255, 255, 1), inset 2px 2px 3px rgba(136, 158, 177, 0.4)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeOut", duration: 0.08 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn2Active ? 'Pressed' : 'Faster 0.08s'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            tween 0.08s | snappier feel
                        </p>
                    </div>

                    {/* Option 3: Deeper Press */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">3. Deeper Press</h4>
                        <motion.button
                            animate={btn3Active ? "pressed" : "initial"}
                            whileHover={!btn3Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn3Active(!btn3Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.97,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 2,
                                    scale: 0.92,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.25), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 3,
                                    scale: 0.88,
                                    boxShadow: isDark
                                        ? "-8px -8px 16px #060709, 5px 5px 10px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.03), inset 1px 1px 3px rgba(0, 0, 0, 0.7)"
                                        : "-7px -7px 12px rgba(136, 158, 177, 0.6), 4px 4px 8px rgba(255, 255, 255, 1), -10px -10px 20px rgba(136, 158, 177, 0.35), inset -2px -2px 4px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(136, 158, 177, 0.5)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeInOut", duration: 0.15 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn3Active ? 'Pressed' : 'Deeper Press'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            y+2, scale 0.92 | heavy sink
                        </p>
                    </div>

                    {/* Option 4: Subtle Anticipation */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">4. Subtle Anticipation</h4>
                        <motion.button
                            animate={btn4Active ? "pressed" : "initial"}
                            whileHover={!btn4Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn4Active(!btn4Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.99,
                                    boxShadow: isDark
                                        ? "3px 3px 6px #060709, -2px -2px 5px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "2px 2px 3px rgba(136, 158, 177, 0.4), -2px -2px 3px rgba(255, 255, 255, 1), 4px 4px 8px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 1,
                                    scale: 0.97,
                                    boxShadow: isDark
                                        ? "-3px -3px 6px #060709, 2px 2px 4px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-2px -2px 3px rgba(136, 158, 177, 0.4), 2px 2px 3px rgba(255, 255, 255, 1), -4px -4px 8px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 2,
                                    scale: 0.94,
                                    boxShadow: isDark
                                        ? "-5px -5px 10px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                                        : "-4px -4px 6px rgba(136, 158, 177, 0.5), 3px 3px 5px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.25), inset -2px -2px 3px rgba(255, 255, 255, 1), inset 2px 2px 3px rgba(136, 158, 177, 0.4)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeOut", duration: 0.12 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn4Active ? 'Pressed' : 'Subtle'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            scale 0.99→0.97 | minimal
                        </p>
                    </div>

                    {/* Option 5: Spring Sink */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">5. Spring Sink</h4>
                        <motion.button
                            animate={btn5Active ? "pressed" : "initial"}
                            whileHover={!btn5Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn5Active(!btn5Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.975,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 1,
                                    scale: 0.95,
                                    boxShadow: isDark
                                        ? "-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 2,
                                    scale: 0.92,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.3), inset -2px -2px 3px rgba(255, 255, 255, 1), inset 2px 2px 3px rgba(136, 158, 177, 0.4)"
                                }
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn5Active ? 'Pressed' : 'Spring Sink'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            spring 500/25 | bouncy return
                        </p>
                    </div>

                    {/* Option 6: No Scale (Shadow Only) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">6. Shadow Only</h4>
                        <motion.button
                            animate={btn6Active ? "pressed" : "initial"}
                            whileHover={!btn6Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn6Active(!btn6Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.03)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(136, 158, 177, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)"
                                },
                                pressed: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -2px -2px 2px rgba(255, 255, 255, 0.1), inset 2px 2px 4px rgba(0, 0, 0, 0.6)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(136, 158, 177, 0.5)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeInOut", duration: 0.15 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn6Active ? 'Pressed' : 'Shadow Only'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            no scale | pure shadow morph
                        </p>
                    </div>

                </div>
            </section>

            {/* --- EXPERIMENTAL SECTION 08: Active Toggle States --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">08. Active Toggle States (Brand Color)</h2>
                <p className="opacity-70">Testing how to make selected/active toggles feel "pressed in" while maintaining the brand purple color.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Option A: Current (Flat Purple - The Problem) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm text-red-500">A. Current ❌ (Flat)</h4>
                        <div className="flex gap-2">
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white`}>
                                Active
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            bg-brand text-white (no shadow)
                        </p>
                    </div>

                    {/* Option B: Brand + ShadowIn */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">B. Brand + ShadowIn</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white`}
                                style={{
                                    boxShadow: isDark
                                        ? `-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)`
                                        : `-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)`
                                }}>
                                Active
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            bg-brand + rotated plateau shadow
                        </p>
                    </div>

                    {/* Option C: Neon Trench (Cyberpunk) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">C. Neon Trench</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-white relative overflow-hidden`}
                                style={{
                                    backgroundColor: '#2D00B3', // Deep purple base
                                    boxShadow: `inset 0 0 10px #00FFFF, inset 0 0 5px #FF00FF, 0 0 15px rgba(109, 93, 252, 0.5)`
                                }}>
                                <span className="relative z-10 mix-blend-overlay">ACTIVE</span>
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            chromatic inner glow + halo
                        </p>
                    </div>

                    {/* Option D: Galaxy Window (Infinite Depth) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">D. Galaxy Window</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-transparent bg-clip-text relative group`}
                                style={{
                                    backgroundImage: isDark
                                        ? 'radial-gradient(circle at center, #FFFFFF 0%, #6D5DFC 100%)' // Text gradient
                                        : 'radial-gradient(circle at center, #FFFFFF 0%, #E0E7FF 100%)',
                                    backgroundColor: '#000', // Void back
                                    boxShadow: `inset 0px 4px 10px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.2)`
                                }}>
                                <div className="absolute inset-0 opacity-80"
                                    style={{
                                        backgroundImage: 'radial-gradient(white 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
                                        backgroundSize: '10px 10px, 20px 20px',
                                        backgroundPosition: '0 0, 5px 5px'
                                    }}
                                />
                                <span className="relative z-10">ACTIVE</span>
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            recessed starfield + void
                        </p>
                    </div>

                    {/* Option E: Gummy Gloss (Lickable) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">E. Gummy Gloss</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-white`}
                                style={{
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%), #6D5DFC',
                                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 5px rgba(109, 93, 252, 0.4), inset 0 -2px 5px rgba(0,0,0,0.2)`
                                }}>
                                Active
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            high gloss + top highlight
                        </p>
                    </div>

                    {/* Option F: Scanline Data (Tech) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">F. Scanline Data</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-[#6D5DFC] relative overflow-hidden`}
                                style={{
                                    backgroundColor: isDark ? '#1a1a2e' : '#e0e7ff',
                                    border: '1px solid #6D5DFC',
                                    boxShadow: `inset 0 0 10px rgba(109, 93, 252, 0.2)`
                                }}>
                                <div className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: 'linear-gradient(0deg, transparent 24%, #6D5DFC 25%, #6D5DFC 26%, transparent 27%, transparent 74%, #6D5DFC 75%, #6D5DFC 76%, transparent 77%, transparent)',
                                        backgroundSize: '50px 50px'
                                    }}
                                />
                                <span className="relative z-10 drop-shadow-[0_0_5px_rgba(109,93,252,0.8)]">ACTIVE</span>
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            digital retro grid + border
                        </p>
                    </div>

                </div>
            </section>

            {/* --- GOOGLE SANS FLEX SHOWCASE --- */}
            <GoogleSansFlexShowcase isDark={isDark} />
        </div>
    );
};
