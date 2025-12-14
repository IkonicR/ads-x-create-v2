import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { NeuCard, NeuButton, useThemeStyles } from '../components/NeuComponents';

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
// COMPONENT
// ============================================================================

export const PrinterDownload: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

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
                <Loader2 size={40} className={`animate-spin ${styles.textSub}`} />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`min-h-screen ${styles.bg} flex items-center justify-center px-4`}>
                <NeuCard className="max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h1 className={`text-2xl font-bold ${styles.textMain} mb-2`}>Link Not Available</h1>
                    <p className={styles.textSub}>{error}</p>
                </NeuCard>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={`min-h-screen ${styles.bg} py-8 px-4`}>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Branding Header */}
                <NeuCard className="text-center">
                    {data.business.logoUrl && (
                        <img
                            src={data.business.logoUrl}
                            alt={data.business.name}
                            className="h-12 object-contain mx-auto mb-3"
                        />
                    )}
                    {data.business.slogan && (
                        <p className={`${styles.textSub} text-sm italic mb-2`}>"{data.business.slogan}"</p>
                    )}
                    <p className={`${styles.textSub} text-sm`}>
                        Asset provided by <span className={`font-semibold ${styles.textMain}`}>{data.business.name}</span>
                    </p>
                </NeuCard>

                {/* Asset Preview */}
                <NeuCard className="overflow-hidden p-0">
                    <img
                        src={data.asset.imageUrl}
                        alt="Asset preview"
                        className="w-full object-contain"
                        style={{ maxHeight: '60vh' }}
                    />
                </NeuCard>

                {/* Download Options */}
                <NeuCard>
                    <h2 className={`text-lg font-bold ${styles.textMain} mb-4 flex items-center gap-2`}>
                        <Download size={20} className="text-brand" />
                        Download Options
                    </h2>

                    {/* Preset Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {(Object.entries(PRESETS) as [PresetId, typeof PRESETS['web']][]).map(([id, preset]) => (
                            <button
                                key={id}
                                onClick={() => {
                                    setSelectedPreset(id);
                                    setShowCustom(id === 'custom');
                                }}
                                className={`p-4 rounded-xl text-left transition-all ${selectedPreset === id
                                    ? 'bg-brand text-white'
                                    : `${styles.shadowIn} ${styles.textMain}`
                                    }`}
                            >
                                <p className="font-semibold text-sm">{preset.name}</p>
                                <p className={`text-xs mt-1 ${selectedPreset === id ? 'text-white/70' : styles.textSub}`}>
                                    {preset.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Custom Settings */}
                    <AnimatePresence>
                        {showCustom && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={`p-4 rounded-xl ${styles.shadowIn} mb-4 space-y-4`}>
                                    <div>
                                        <label className={`text-xs ${styles.textSub} uppercase tracking-wider mb-2 block`}>Format</label>
                                        <div className="flex gap-2">
                                            {(['png', 'jpeg', 'webp', 'pdf'] as const).map((f) => (
                                                <button
                                                    key={f}
                                                    onClick={() => setFormat(f)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase ${format === f
                                                        ? 'bg-brand text-white'
                                                        : `${styles.shadowOut} ${styles.textSub}`
                                                        }`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {format === 'pdf' && (
                                        <>
                                            <div>
                                                <label className={`text-xs ${styles.textSub} uppercase tracking-wider mb-2 block`}>DPI</label>
                                                <div className="flex gap-2">
                                                    {[72, 150, 300, 600].map((d) => (
                                                        <button
                                                            key={d}
                                                            onClick={() => setDpi(d)}
                                                            className={`flex-1 py-2 rounded-lg text-sm ${dpi === d
                                                                ? 'bg-brand text-white'
                                                                : `${styles.shadowOut} ${styles.textSub}`
                                                                }`}
                                                        >
                                                            {d}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className={`text-xs ${styles.textSub} uppercase tracking-wider mb-2 block`}>Bleed</label>
                                                <div className="flex gap-2">
                                                    {[0, 3, 5].map((b) => (
                                                        <button
                                                            key={b}
                                                            onClick={() => setBleedMm(b)}
                                                            className={`flex-1 py-2 rounded-lg text-sm ${bleedMm === b
                                                                ? 'bg-brand text-white'
                                                                : `${styles.shadowOut} ${styles.textSub}`
                                                                }`}
                                                        >
                                                            {b === 0 ? 'None' : `${b}mm`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm ${styles.textMain}`}>Crop Marks</span>
                                                <button
                                                    onClick={() => setCropMarks(!cropMarks)}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${cropMarks ? 'bg-brand' : styles.shadowIn}`}
                                                >
                                                    <motion.div
                                                        className={`w-5 h-5 ${styles.bg} rounded-full absolute top-0.5 ${styles.shadowOut}`}
                                                        animate={{ left: cropMarks ? 26 : 2 }}
                                                    />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Download Button */}
                    <NeuButton
                        className="w-full py-4 text-lg"
                        variant="primary"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Preparing Download...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Download {PRESETS[selectedPreset].name}
                            </>
                        )}
                    </NeuButton>

                    {/* Expiry Note */}
                    {data.share.expiresAt && (
                        <div className={`mt-4 text-center ${styles.textSub} text-sm flex items-center justify-center gap-2`}>
                            <Clock size={14} />
                            Link expires {formatExpiry(data.share.expiresAt)}
                        </div>
                    )}
                </NeuCard>

                {/* Footer */}
                <div className={`text-center ${styles.textSub} text-xs`}>
                    Powered by Ads x Create
                </div>
            </div>
        </div>
    );
};
