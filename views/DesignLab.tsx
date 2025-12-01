import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { useTheme } from '../context/ThemeContext';
import {
    NeuCard,
    NeuButton,
    NeuInput,
    NeuTextArea,
    NeuBadge,
    NeuSelect,
    NeuListBuilder,
    NeuDropdown,
    BRAND_COLOR
} from '../components/NeuComponents';
import { Zap, Check, X, AlertCircle } from 'lucide-react';

const ColorSwatch = ({ color, name, hex }: { color: string, name: string, hex?: string }) => (
    <div className="flex flex-col gap-2">
        <div className={`w-full h-24 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 ${color}`}></div>
        <div className="flex flex-col">
            <span className="font-bold text-sm">{name}</span>
            {hex && <span className="text-xs opacity-50 font-mono">{hex}</span>}
        </div>
    </div>
);



const DesignLab = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState('components');
    const [listItems, setListItems] = useState<string[]>(['Design', 'System', 'Rocks']);

    return (
        <div className={`min-h-screen p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}>
            <div className="max-w-7xl mx-auto space-y-16 pb-20">

                {/* --- HEADER --- */}
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <NeuBadge>Internal Tool</NeuBadge>
                        </div>
                        <GalaxyHeading text="DESIGN SYSTEM" className="text-4xl md:text-6xl" />
                        <p className={`mt-4 text-lg max-w-2xl ${theme === 'dark' ? 'text-neu-text-sub-dark' : 'text-neu-text-sub-light'}`}>
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
                            <p className={`md:col-span-2 leading-relaxed ${theme === 'dark' ? 'text-neu-text-main-dark' : 'text-neu-text-main-light'}`}>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                            <span className="text-xs font-mono opacity-50">Small / Medium</span>
                            <p className={`text-sm font-medium md:col-span-2 ${theme === 'dark' ? 'text-neu-text-sub-dark' : 'text-neu-text-sub-light'}`}>
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
                                        ? `
                                            /* Dark */
                                            4px 4px 8px #060709,
                                            -3px -3px 6px #181b21,
                                            inset 1px 1px 1px rgba(255, 255, 255, 0.1),
                                            inset -1px -1px 2px rgba(0, 0, 0, 0.5)
                                          `
                                        : `
                                            /* Light */
                                            3px 3px 4px rgba(136, 158, 177, 0.4),
                                            -2px -2px 4px rgba(255, 255, 255, 1),
                                            6px 6px 12px rgba(136, 158, 177, 0.2),
                                            inset 1px 1px 2px rgba(255, 255, 255, 1),
                                            inset -1px -1px 2px rgba(136, 158, 177, 0.3)
                                          `
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
                                        ? `
                                            /* Dark */
                                            6px 6px 12px #050608, 
                                            -6px -6px 12px #16191e,
                                            inset 2px 2px 4px rgba(0, 0, 0, 0.5)
                                          `
                                        : `
                                            /* Light */
                                            6px 6px 12px rgba(136, 158, 177, 0.3), 
                                            -6px -6px 12px rgba(255, 255, 255, 1),
                                            inset 2px 2px 4px rgba(136, 158, 177, 0.1)
                                          `
                                }}>
                                Bezel
                            </div>
                        </div>

                        {/* Option 3: The Deep Plateau (Deep 10px Dip) */}
                        <div className="space-y-4">
                            <h3 className="font-bold">Option 3: "The Deep Plateau" (Deep 10px Dip)</h3>
                            <p className="text-xs opacity-50 font-mono">Outer Plateau + Deep 10px Blur Dish</p>

                            {/* Outer Base (Exact Copy of Option 1 + Padding) */}
                            <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 p-3"
                                style={{
                                    backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `
                                            /* Dark (Option 1 Exact) */
                                            4px 4px 8px #060709,
                                            -3px -3px 6px #181b21,
                                            inset 1px 1px 1px rgba(255, 255, 255, 0.1),
                                            inset -1px -1px 2px rgba(0, 0, 0, 0.5)
                                          `
                                        : `
                                            /* Light (Option 1 Exact) */
                                            3px 3px 4px rgba(136, 158, 177, 0.4),
                                            -2px -2px 4px rgba(255, 255, 255, 1),
                                            6px 6px 12px rgba(136, 158, 177, 0.2),
                                            inset 1px 1px 2px rgba(255, 255, 255, 1),
                                            inset -1px -1px 2px rgba(136, 158, 177, 0.3)
                                          `
                                }}>

                                {/* Inner Dish (Deep + 10px Blur) */}
                                <div className="w-full h-full rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                                    style={{
                                        color: isDark ? '#E5E7EB' : '#4B5563',
                                        boxShadow: isDark
                                            ? `
                                                /* Dark Inner (Deep + 10px Blur) */
                                                inset 5px 5px 10px rgba(0, 0, 0, 0.7),
                                                inset -5px -5px 10px rgba(255, 255, 255, 0.03)
                                              `
                                            : `
                                                /* Light Inner (Deep + 10px Blur) */
                                                inset 5px 5px 10px rgba(136, 158, 177, 0.3),
                                                inset -5px -5px 10px rgba(255, 255, 255, 0.8)
                                              `
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
                                        ? `
                                            /* Dark */
                                            5px 5px 10px #050608, 
                                            -5px -5px 10px #16191e,
                                            inset 0px 0px 0px 1px rgba(255,255,255,0.03),
                                            inset 2px 2px 5px rgba(0,0,0,0.5)
                                          `
                                        : `
                                            /* Light */
                                            5px 5px 10px rgba(136, 158, 177, 0.35), 
                                            -5px -5px 10px rgba(255, 255, 255, 1),
                                            inset 0px 0px 0px 1px rgba(255,255,255,0.5),
                                            inset 2px 2px 5px rgba(136, 158, 177, 0.1)
                                          `
                                }}>
                                Curved
                            </div>
                        </div>

                    </div>
                </section>

                {/* --- EXPERIMENTAL ROUND 5 (Pure Inset Experiments) --- */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">05. Pure Inset Experiments</h2>
                    <p className="opacity-70">Stripped of all outside shadows. Pure "hole" effect. Exact values shown.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Option 1: The Abyss (Max Darkness) */}
                        <div className="space-y-4">
                            <h3 className="font-bold">Option 1: "The Abyss"</h3>
                            <div className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                                {isDark ? 'inset 4px 4px 8px rgba(0,0,0,0.9)' : 'inset 4px 4px 8px rgba(136,158,177,0.9)'}
                            </div>
                            <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                                style={{
                                    backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `
                                            inset 4px 4px 8px rgba(0, 0, 0, 0.9),
                                            inset -4px -4px 8px rgba(255, 255, 255, 0.05)
                                          `
                                        : `
                                            inset 4px 4px 8px rgba(136, 158, 177, 0.9),
                                            inset -4px -4px 8px rgba(255, 255, 255, 1)
                                          `
                                }}>
                                Abyss
                            </div>
                        </div>

                        {/* Option 2: The Canyon (Steep Walls) */}
                        <div className="space-y-4">
                            <h3 className="font-bold">Option 2: "The Canyon"</h3>
                            <div className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                                {isDark ? 'inset 6px 6px 4px rgba(0,0,0,0.8)' : 'inset 6px 6px 4px rgba(136,158,177,0.6)'}
                            </div>
                            <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                                style={{
                                    backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `
                                            inset 6px 6px 4px rgba(0, 0, 0, 0.8),
                                            inset -6px -6px 4px rgba(255, 255, 255, 0.05)
                                          `
                                        : `
                                            inset 6px 6px 4px rgba(136, 158, 177, 0.6),
                                            inset -6px -6px 4px rgba(255, 255, 255, 1)
                                          `
                                }}>
                                Canyon
                            </div>
                        </div>

                        {/* Option 3: The Layer Cake (Multi-Step) */}
                        <div className="space-y-4">
                            <h3 className="font-bold">Option 3: "The Layer Cake"</h3>
                            <div className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                                3 Nested Insets (Gradient)
                            </div>
                            <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                                style={{
                                    backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `
                                            inset 2px 2px 3px rgba(0, 0, 0, 0.6),
                                            inset 4px 4px 6px rgba(0, 0, 0, 0.6),
                                            inset 6px 6px 12px rgba(0, 0, 0, 0.6),
                                            inset -2px -2px 3px rgba(255, 255, 255, 0.05)
                                          `
                                        : `
                                            inset 2px 2px 3px rgba(136, 158, 177, 0.4),
                                            inset 4px 4px 6px rgba(136, 158, 177, 0.4),
                                            inset 6px 6px 12px rgba(136, 158, 177, 0.4),
                                            inset -2px -2px 3px rgba(255, 255, 255, 0.8)
                                          `
                                }}>
                                Layers
                            </div>
                        </div>

                        {/* Option 4: The Void (Pure Black) */}
                        <div className="space-y-4">
                            <h3 className="font-bold">Option 4: "The Void"</h3>
                            <div className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                                {isDark ? 'inset 4px 4px 8px rgba(0,0,0,1)' : 'inset 4px 4px 8px rgba(136,158,177,1)'}
                            </div>
                            <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                                style={{
                                    backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `
                                            inset 4px 4px 8px rgba(0, 0, 0, 1),
                                            inset -4px -4px 8px rgba(255, 255, 255, 0.05)
                                          `
                                        : `
                                            inset 4px 4px 8px rgba(136, 158, 177, 1),
                                            inset -4px -4px 8px rgba(255, 255, 255, 1)
                                          `
                                }}>
                                Void
                            </div>
                        </div>

                        {/* Option 5: The Mariana (Extreme Offset) */}
                        <div className="space-y-4">
                            <h3 className="font-bold">Option 5: "The Mariana"</h3>
                            <div className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                                {isDark ? 'inset 10px 10px 20px rgba(0,0,0,1)' : 'inset 10px 10px 20px rgba(136,158,177,1)'}
                            </div>
                            <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                                style={{
                                    backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `
                                            inset 10px 10px 20px rgba(0, 0, 0, 1),
                                            inset -10px -10px 20px rgba(255, 255, 255, 0.05)
                                          `
                                        : `
                                            inset 10px 10px 20px rgba(136, 158, 177, 1),
                                            inset -10px -10px 20px rgba(255, 255, 255, 1)
                                          `
                                }}>
                                Mariana
                            </div>
                        </div>

                        {/* Option 6: The Singularity (Multi-Layer Void) */}
                        <div className="space-y-4">
                            <h3 className="font-bold">Option 6: "The Singularity"</h3>
                            <div className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                                3 Layers of Pure Black
                            </div>
                            <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                                style={{
                                    backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `
                                            inset 0px 0px 30px rgba(0, 0, 0, 1),
                                            inset 10px 10px 10px rgba(0, 0, 0, 1),
                                            inset 2px 2px 2px rgba(0, 0, 0, 1),
                                            inset -2px -2px 2px rgba(255, 255, 255, 0.05)
                                          `
                                        : `
                                            inset 0px 0px 30px rgba(136, 158, 177, 1),
                                            inset 10px 10px 10px rgba(136, 158, 177, 1),
                                            inset 2px 2px 2px rgba(136, 158, 177, 1),
                                            inset -2px -2px 2px rgba(255, 255, 255, 1)
                                          `
                                }}>
                                Singularity
                            </div>
                        </div>

                    </div>
                </section>

                {/* --- EXPERIMENTAL ROUND 6 (The Perfect Tactile Key) --- */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">06. The Perfect Tactile Key</h2>
                    <p className="opacity-70">One button. Perfect physics. Heavy, grounded, physical.</p>

                    <div className="flex flex-col items-center justify-center py-12 bg-black/5 dark:bg-white/5 rounded-3xl">

                        <div className="space-y-6 flex flex-col items-center">
                            <h3 className="font-bold text-lg opacity-50">Try It Out</h3>

                            <motion.button
                                initial="initial"
                                whileHover="hover"
                                whileTap="pressed"
                                variants={{
                                    initial: {
                                        y: 0,
                                        scale: 1,
                                        boxShadow: isDark
                                            ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5), inset 4px 4px 8px rgba(0, 0, 0, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)"
                                            : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3), inset 4px 4px 8px rgba(136, 158, 177, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)"
                                    },
                                    hover: {
                                        y: 0,
                                        scale: 0.975, // HEAVY: Deep Anticipation
                                        boxShadow: isDark
                                            ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5), inset 4px 4px 8px rgba(0, 0, 0, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)" // Very Tight
                                            : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3), inset 4px 4px 8px rgba(136, 158, 177, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)" // Very Tight
                                    },
                                    pressed: {
                                        y: 1,
                                        scale: 0.95, // Deepest Press
                                        boxShadow: isDark
                                            ? "4px 4px 8px rgba(6, 7, 9, 0), -3px -3px 6px rgba(24, 27, 33, 0), inset 1px 1px 1px rgba(255, 255, 255, 0), inset -1px -1px 2px rgba(0, 0, 0, 0), inset 4px 4px 8px rgba(0, 0, 0, 0.9), inset -4px -4px 8px rgba(255, 255, 255, 0.05)"
                                            : "3px 3px 4px rgba(136, 158, 177, 0), -2px -2px 4px rgba(255, 255, 255, 0), 6px 6px 12px rgba(136, 158, 177, 0), inset 1px 1px 2px rgba(255, 255, 255, 0), inset -1px -1px 2px rgba(136, 158, 177, 0), inset 4px 4px 8px rgba(136, 158, 177, 0.9), inset -4px -4px 8px rgba(255, 255, 255, 1)"
                                    }
                                }}
                                transition={{
                                    type: "tween",
                                    ease: "easeInOut",
                                    duration: 0.3
                                }}
                                className={`rounded-2xl px-12 py-6 text-xl font-bold flex items-center justify-center gap-3 select-none outline-none focus:ring-4 focus:ring-offset-4 ${isDark ? 'bg-neu-dark text-neu-text-main-dark focus:ring-brand/50 focus:ring-offset-neu-dark' : 'bg-neu-light text-neu-text-main-light focus:ring-brand/50 focus:ring-offset-neu-light'}`}
                            >
                                The Liquid Morph
                            </motion.button>

                            <p className="text-xs font-mono opacity-40 pt-4">
                                Heavy Anticipation | Scale: 0.975 | Very Tight Shadows
                            </p>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
};

export default DesignLab;
