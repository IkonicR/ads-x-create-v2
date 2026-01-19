import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { NeuCard, NeuButton, useThemeStyles, useNeuAnimations, BRAND_COLOR } from '../components/NeuComponents';

// ============================================================================
// TYPES
// ============================================================================

interface ShareData {
    share: {
        id: string;
        expiresAt: string | null;
        downloadCount: number;
    };
    asset: {
        id: string;
        imageUrl: string;
        aspectRatio: string;
        createdAt: string;
    };
    business: {
        name: string;
        logoUrl: string | null;
        slogan: string | null;
    };
}

type PresetId = 'web' | 'instagram' | 'print-a4' | 'custom';

interface ExportConfig {
    format: 'png' | 'jpeg' | 'webp' | 'pdf';
    pdfType?: 'digital' | 'print-ready';
    colorSpace?: 'rgb' | 'cmyk';
    dpi?: number;
    bleedMm?: number;
    cropMarks?: boolean;
    paperSize?: string;
    fitMode?: 'fit' | 'fill' | 'stretch';
}

const PRESETS: Record<PresetId, { name: string; description: string; config: ExportConfig }> = {
    web: {
        name: 'Web (Quick)',
        description: 'PNG, optimized for screens',
        config: { format: 'png' },
    },
    instagram: {
        name: 'Instagram Post',
        description: 'JPEG, 1080×1080',
        config: { format: 'jpeg', paperSize: 'instagram-square', fitMode: 'fill' },
    },
    'print-a4': {
        name: 'Print-Ready A4',
        description: 'PDF, CMYK, 300 DPI, 3mm bleed',
        config: {
            format: 'pdf',
            pdfType: 'print-ready',
            colorSpace: 'cmyk',
            dpi: 300,
            bleedMm: 3,
            cropMarks: true,
            paperSize: 'a4-portrait',
            fitMode: 'fit',
        },
    },
    custom: {
        name: 'Custom Settings',
        description: 'Configure your own export',
        config: { format: 'png' },
    },
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
    }
};

// Button animations use useNeuAnimations() hook for consistent pressed-in effect

const customPanelVariants = {
    hidden: {
        height: 0,
        opacity: 0,
        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
    },
    visible: {
        height: 'auto',
        opacity: 1,
        transition: {
            height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 0.25, delay: 0.1 }
        }
    }
};

const optionGroupVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.15 }
    }
};

const optionItemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
    }
};

// ============================================================================
// COMPONENT
// ============================================================================

export const PrinterDownload: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';
    const neuAnimations = useNeuAnimations();

    // State
    const [data, setData] = useState<ShareData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPreset, setSelectedPreset] = useState<PresetId>('web');
    const [showCustom, setShowCustom] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Custom settings
    const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'pdf'>('png');
    const [dpi, setDpi] = useState(300);
    const [bleedMm, setBleedMm] = useState(0);
    const [cropMarks, setCropMarks] = useState(false);

    // Load share data
    useEffect(() => {
        if (!token) return;
        loadShareData();
    }, [token]);

    const loadShareData = async () => {
        try {
            const response = await fetch(`/api/share/validate/${token}`);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to load share');
            }

            const shareData = await response.json();
            setData(shareData);
        } catch (e: any) {
            setError(e.message);
        }
        setIsLoading(false);
    };

    const handleDownload = async () => {
        if (!data) return;
        setIsDownloading(true);

        try {
            const preset = PRESETS[selectedPreset];
            const config = selectedPreset === 'custom'
                ? { format, dpi, bleedMm, cropMarks, pdfType: format === 'pdf' ? 'print-ready' : undefined }
                : preset.config;

            const response = await fetch('/api/export-print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: data.asset.imageUrl,
                    shareToken: token,
                    ...config,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Download failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.business.name.replace(/\s+/g, '-')}-asset.${config.format === 'pdf' ? 'pdf' : config.format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert(e.message);
        }

        setIsDownloading(false);
    };

    const formatExpiry = (expiresAt: string | null) => {
        if (!expiresAt) return null;
        const date = new Date(expiresAt);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`min-h-screen ${styles.bg} flex items-center justify-center`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    <Loader2 size={40} className={`animate-spin ${styles.textSub}`} />
                </motion.div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`min-h-screen ${styles.bg} flex items-center justify-center px-4`}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    <NeuCard className="max-w-md text-center">
                        <motion.div
                            className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                        >
                            <AlertCircle size={32} className="text-red-500" />
                        </motion.div>
                        <h1 className={`text-2xl font-bold ${styles.textMain} mb-2`}>Link Not Available</h1>
                        <p className={styles.textSub}>{error}</p>
                    </NeuCard>
                </motion.div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={`min-h-screen ${styles.bg} py-8 px-4`}>
            <motion.div
                className="max-w-2xl mx-auto space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Branding Header */}
                <motion.div variants={itemVariants}>
                    <NeuCard className="text-center">
                        {data.business.logoUrl && (
                            <motion.img
                                src={data.business.logoUrl}
                                alt={data.business.name}
                                className="h-12 object-contain mx-auto mb-3"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            />
                        )}
                        {data.business.slogan && (
                            <p className={`${styles.textSub} text-sm italic mb-2`}>"{data.business.slogan}"</p>
                        )}
                        <p className={`${styles.textSub} text-sm`}>
                            Asset provided by <span className={`font-semibold ${styles.textMain}`}>{data.business.name}</span>
                        </p>
                    </NeuCard>
                </motion.div>

                {/* Asset Preview */}
                <motion.div variants={itemVariants}>
                    <NeuCard className="overflow-hidden p-0">
                        <motion.img
                            src={data.asset.imageUrl}
                            alt="Asset preview"
                            className="w-full object-contain"
                            style={{ maxHeight: '60vh' }}
                            initial={{ opacity: 0, scale: 1.02 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                    </NeuCard>
                </motion.div>

                {/* Download Options */}
                <motion.div variants={itemVariants}>
                    <NeuCard>
                        <motion.h2
                            className={`text-lg font-bold ${styles.textMain} mb-4 flex items-center gap-2`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Download size={20} className="text-brand" />
                            Download Options
                        </motion.h2>

                        {/* Preset Buttons */}
                        <motion.div
                            className="grid grid-cols-2 gap-3 mb-4"
                            variants={optionGroupVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {(Object.entries(PRESETS) as [PresetId, typeof PRESETS['web']][]).map(([id, preset]) => (
                                <motion.button
                                    key={id}
                                    initial="initial"
                                    whileHover={selectedPreset !== id ? "hover" : undefined}
                                    whileTap="deepPressed"
                                    animate={selectedPreset === id ? "pressed" : "initial"}
                                    variants={neuAnimations}
                                    transition={{ type: "tween", ease: "easeOut", duration: 0.08 }}
                                    onClick={() => {
                                        setSelectedPreset(id);
                                        setShowCustom(id === 'custom');
                                    }}
                                    className={`p-4 rounded-xl text-left transition-colors duration-200 ${selectedPreset === id
                                        ? 'bg-brand text-white'
                                        : `${styles.bg} ${styles.textMain}`
                                        }`}
                                >
                                    <p className="font-semibold text-sm">{preset.name}</p>
                                    <p className={`text-xs mt-1 ${selectedPreset === id ? 'text-white/70' : styles.textSub}`}>
                                        {preset.description}
                                    </p>
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* Custom Settings */}
                        <AnimatePresence mode="wait">
                            {showCustom && (
                                <motion.div
                                    variants={customPanelVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className="overflow-hidden"
                                >
                                    <motion.div
                                        className={`p-4 rounded-xl ${styles.shadowIn} mb-4 space-y-4`}
                                        variants={optionGroupVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {/* Format Selection */}
                                        <motion.div variants={optionItemVariants}>
                                            <label className={`text-xs ${styles.textSub} uppercase tracking-wider mb-2 block`}>Format</label>
                                            <div className="flex gap-2">
                                                {(['png', 'jpeg', 'webp', 'pdf'] as const).map((f) => (
                                                    <motion.button
                                                        key={f}
                                                        initial="initial"
                                                        whileHover={format !== f ? "hover" : undefined}
                                                        whileTap="deepPressed"
                                                        animate={format === f ? "pressed" : "initial"}
                                                        variants={neuAnimations}
                                                        transition={{ type: "tween", ease: "easeOut", duration: 0.08 }}
                                                        onClick={() => setFormat(f)}
                                                        className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase transition-colors duration-150 ${format === f
                                                            ? 'bg-brand text-white'
                                                            : `${styles.bg} ${styles.textSub}`
                                                            }`}
                                                    >
                                                        {f}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>

                                        {/* PDF-specific options with smooth reveal */}
                                        <AnimatePresence mode="wait">
                                            {format === 'pdf' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                                    className="space-y-4 overflow-hidden"
                                                >
                                                    {/* DPI Selection */}
                                                    <motion.div
                                                        variants={optionItemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                    >
                                                        <label className={`text-xs ${styles.textSub} uppercase tracking-wider mb-2 block`}>DPI</label>
                                                        <div className="flex gap-2">
                                                            {[72, 150, 300, 600].map((d) => (
                                                                <motion.button
                                                                    key={d}
                                                                    initial="initial"
                                                                    whileHover={dpi !== d ? "hover" : undefined}
                                                                    whileTap="deepPressed"
                                                                    animate={dpi === d ? "pressed" : "initial"}
                                                                    variants={neuAnimations}
                                                                    transition={{ type: "tween", ease: "easeOut", duration: 0.08 }}
                                                                    onClick={() => setDpi(d)}
                                                                    className={`flex-1 py-2 rounded-lg text-sm transition-colors duration-150 ${dpi === d
                                                                        ? 'bg-brand text-white'
                                                                        : `${styles.bg} ${styles.textSub}`
                                                                        }`}
                                                                >
                                                                    {d}
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    </motion.div>

                                                    {/* Bleed Selection */}
                                                    <motion.div
                                                        variants={optionItemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        transition={{ delay: 0.05 }}
                                                    >
                                                        <label className={`text-xs ${styles.textSub} uppercase tracking-wider mb-2 block`}>Bleed</label>
                                                        <div className="flex gap-2">
                                                            {[0, 3, 5].map((b) => (
                                                                <motion.button
                                                                    key={b}
                                                                    initial="initial"
                                                                    whileHover={bleedMm !== b ? "hover" : undefined}
                                                                    whileTap="deepPressed"
                                                                    animate={bleedMm === b ? "pressed" : "initial"}
                                                                    variants={neuAnimations}
                                                                    transition={{ type: "tween", ease: "easeOut", duration: 0.08 }}
                                                                    onClick={() => setBleedMm(b)}
                                                                    className={`flex-1 py-2 rounded-lg text-sm transition-colors duration-150 ${bleedMm === b
                                                                        ? 'bg-brand text-white'
                                                                        : `${styles.bg} ${styles.textSub}`
                                                                        }`}
                                                                >
                                                                    {b === 0 ? 'None' : `${b}mm`}
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    </motion.div>

                                                    {/* Crop Marks Toggle */}
                                                    <motion.div
                                                        className="flex items-center justify-between"
                                                        variants={optionItemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        transition={{ delay: 0.1 }}
                                                    >
                                                        <span className={`text-sm ${styles.textMain}`}>Crop Marks</span>
                                                        <motion.button
                                                            onClick={() => setCropMarks(!cropMarks)}
                                                            className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${cropMarks ? 'bg-brand' : styles.shadowIn}`}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <motion.div
                                                                className="w-5 h-5 rounded-full absolute top-0.5"
                                                                animate={{
                                                                    x: cropMarks ? 24 : 2,
                                                                    backgroundColor: cropMarks ? BRAND_COLOR : (isDark ? '#1a1d23' : '#F9FAFB'),
                                                                    boxShadow: cropMarks
                                                                        ? '0 2px 4px rgba(0,0,0,0.2)'
                                                                        : (isDark
                                                                            ? '2px 2px 4px #060709, -1px -1px 2px #181b21'
                                                                            : '2px 2px 4px rgba(136, 158, 177, 0.3), -1px -1px 2px rgba(255, 255, 255, 0.8)')
                                                                }}
                                                                transition={{
                                                                    type: 'spring',
                                                                    stiffness: 500,
                                                                    damping: 30
                                                                }}
                                                            />
                                                        </motion.button>
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Download Button - NeuButton already has proper animations */}
                        <NeuButton
                            className="w-full py-4 text-lg"
                            variant="primary"
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            <AnimatePresence mode="wait">
                                {isDownloading ? (
                                    <motion.span
                                        key="loading"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Loader2 size={20} className="animate-spin" />
                                        Preparing Download...
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="ready"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Download size={20} />
                                        Download {PRESETS[selectedPreset].name}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NeuButton>

                        {/* Expiry Note */}
                        {data.share.expiresAt && (
                            <motion.div
                                className={`mt-4 text-center ${styles.textSub} text-sm flex items-center justify-center gap-2`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Clock size={14} />
                                Link expires {formatExpiry(data.share.expiresAt)}
                            </motion.div>
                        )}
                    </NeuCard>
                </motion.div>

                {/* Footer */}
                <motion.div
                    className={`text-center ${styles.textSub} text-xs`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    Powered by Ads x Create
                </motion.div>
            </motion.div>
        </div>
    );
};
