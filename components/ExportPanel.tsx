import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles, NeuButton } from './NeuComponents';
import { Download, Loader2, FileImage, FileType, Image, X, Save, ChevronDown, AlertTriangle, Trash2, Settings } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ExportFormat = 'png' | 'jpeg' | 'webp' | 'pdf';
type PDFType = 'digital' | 'print-ready';
type ColorSpace = 'rgb' | 'cmyk';
type FitMode = 'fit' | 'fill' | 'stretch';

export interface ExportPreset {
    id: string;
    name: string;
    format: ExportFormat;
    pdfType?: PDFType;
    colorSpace?: ColorSpace;
    dpi?: number;
    bleedMm?: number;
    cropMarks?: boolean;
    paperSize?: string;
    fitMode?: FitMode;
    isSystem?: boolean;
}

interface ExportPanelProps {
    imageUrl: string;
    imageAspectRatio?: number; // width / height
    onClose: () => void;
    businessName?: string;
    savedPresets?: ExportPreset[];
    onSavePreset?: (preset: ExportPreset) => void;
    onDeletePreset?: (id: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { value: 'png', label: 'PNG', icon: <FileImage size={16} /> },
    { value: 'jpeg', label: 'JPEG', icon: <Image size={16} /> },
    { value: 'webp', label: 'WebP', icon: <Image size={16} /> },
    { value: 'pdf', label: 'PDF', icon: <FileType size={16} /> },
];

const dpiOptions = [72, 150, 300, 600];
const bleedOptions = [0, 3, 5];

// Paper sizes with dimensions in mm
const PAPER_SIZES: Record<string, { name: string; widthMm: number; heightMm: number; category: string }> = {
    'custom': { name: 'Original Size', widthMm: 0, heightMm: 0, category: 'Default' },
    'a4-portrait': { name: 'A4 Portrait', widthMm: 210, heightMm: 297, category: 'Print' },
    'a4-landscape': { name: 'A4 Landscape', widthMm: 297, heightMm: 210, category: 'Print' },
    'a5-portrait': { name: 'A5 Portrait', widthMm: 148, heightMm: 210, category: 'Print' },
    'letter-portrait': { name: 'US Letter', widthMm: 216, heightMm: 279, category: 'Print' },
    'instagram-square': { name: 'Instagram Square', widthMm: 108, heightMm: 108, category: 'Social' }, // 1080px @ 254 DPI ≈ 108mm
    'instagram-story': { name: 'Instagram Story', widthMm: 108, heightMm: 192, category: 'Social' },
    'facebook-post': { name: 'Facebook Post', widthMm: 120, heightMm: 63, category: 'Social' }, // 1200x630
};

// System presets (always available)
const SYSTEM_PRESETS: ExportPreset[] = [
    { id: 'sys-web', name: 'Web (Quick)', format: 'png', isSystem: true },
    { id: 'sys-instagram', name: 'Instagram Post', format: 'jpeg', paperSize: 'instagram-square', fitMode: 'fill', isSystem: true },
    { id: 'sys-print-a4', name: 'Print-Ready A4', format: 'pdf', pdfType: 'print-ready', colorSpace: 'cmyk', dpi: 300, bleedMm: 3, cropMarks: true, paperSize: 'a4-portrait', fitMode: 'fit', isSystem: true },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const ExportPanel: React.FC<ExportPanelProps> = ({
    imageUrl,
    imageAspectRatio = 1,
    onClose,
    businessName,
    savedPresets = [],
    onSavePreset,
    onDeletePreset,
}) => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

    // Export settings state
    const [format, setFormat] = useState<ExportFormat>('png');
    const [pdfType, setPdfType] = useState<PDFType>('digital');
    const [colorSpace, setColorSpace] = useState<ColorSpace>('rgb');
    const [dpi, setDpi] = useState(300);
    const [bleedMm, setBleedMm] = useState(0);
    const [customBleed, setCustomBleed] = useState('');
    const [cropMarks, setCropMarks] = useState(false);
    const [paperSize, setPaperSize] = useState('custom');
    const [fitMode, setFitMode] = useState<FitMode>('fit');
    const [isExporting, setIsExporting] = useState(false);

    // Preset state
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);
    const [showSavePreset, setShowSavePreset] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');

    const allPresets = useMemo(() => [...SYSTEM_PRESETS, ...savedPresets], [savedPresets]);
    const isPrintReady = format === 'pdf' && pdfType === 'print-ready';
    const effectiveBleed = customBleed ? parseInt(customBleed, 10) : bleedMm;
    const showPaperSize = format === 'pdf';

    // Calculate aspect ratio mismatch
    const selectedPaper = PAPER_SIZES[paperSize];
    const paperAspectRatio = selectedPaper?.widthMm && selectedPaper?.heightMm
        ? selectedPaper.widthMm / selectedPaper.heightMm
        : imageAspectRatio;
    const aspectMismatch = paperSize !== 'custom' && Math.abs(imageAspectRatio - paperAspectRatio) > 0.05;

    // Load preset
    const loadPreset = (preset: ExportPreset) => {
        setFormat(preset.format);
        if (preset.pdfType) setPdfType(preset.pdfType);
        if (preset.colorSpace) setColorSpace(preset.colorSpace);
        if (preset.dpi) setDpi(preset.dpi);
        if (preset.bleedMm !== undefined) setBleedMm(preset.bleedMm);
        if (preset.cropMarks !== undefined) setCropMarks(preset.cropMarks);
        if (preset.paperSize) setPaperSize(preset.paperSize);
        if (preset.fitMode) setFitMode(preset.fitMode);
        setSelectedPresetId(preset.id);
        setShowPresetDropdown(false);
    };

    // Save current settings as preset
    const handleSavePreset = () => {
        if (!newPresetName.trim() || !onSavePreset) return;

        const preset: ExportPreset = {
            id: `preset-${Date.now()}`,
            name: newPresetName.trim(),
            format,
            pdfType: format === 'pdf' ? pdfType : undefined,
            colorSpace: isPrintReady ? colorSpace : undefined,
            dpi: isPrintReady ? dpi : undefined,
            bleedMm: isPrintReady ? effectiveBleed : undefined,
            cropMarks: isPrintReady ? cropMarks : undefined,
            paperSize: showPaperSize ? paperSize : undefined,
            fitMode: showPaperSize && paperSize !== 'custom' ? fitMode : undefined,
        };

        onSavePreset(preset);
        setNewPresetName('');
        setShowSavePreset(false);
        setSelectedPresetId(preset.id);
    };

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const response = await fetch('/api/export-print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl,
                    format,
                    pdfType: format === 'pdf' ? pdfType : 'digital',
                    colorSpace: isPrintReady ? colorSpace : 'rgb',
                    dpi: isPrintReady ? dpi : 150,
                    bleedMm: isPrintReady ? effectiveBleed : 0,
                    cropMarks: isPrintReady ? cropMarks : false,
                    paperSize: showPaperSize ? paperSize : 'custom',
                    fitMode: showPaperSize && paperSize !== 'custom' ? fitMode : 'fit',
                }),
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = format === 'pdf' ? 'pdf' : format;
            a.download = `${businessName || 'export'}${paperSize !== 'custom' ? `-${paperSize}` : ''}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);

            onClose();
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
        >
            <div className={`p-4 border-t border-white/5 space-y-4`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${styles.textMain}`}>
                        Export Settings
                    </h4>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg ${styles.textSub} hover:${styles.textMain} transition-colors`}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Preset Selector */}
                <div className="relative">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                        Preset
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${styles.shadowOut} ${styles.textMain}`}
                        >
                            <span>{selectedPresetId ? allPresets.find(p => p.id === selectedPresetId)?.name || 'Custom' : 'Select Preset...'}</span>
                            <ChevronDown size={14} className={showPresetDropdown ? 'rotate-180' : ''} />
                        </button>
                        {onSavePreset && (
                            <button
                                onClick={() => setShowSavePreset(!showSavePreset)}
                                className={`p-2 rounded-xl transition-all ${styles.shadowOut} ${styles.textSub} hover:${styles.textMain}`}
                                title="Save as Preset"
                            >
                                <Save size={16} />
                            </button>
                        )}
                    </div>

                    {/* Preset Dropdown */}
                    <AnimatePresence>
                        {showPresetDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`absolute z-20 left-0 right-0 mt-2 rounded-xl overflow-hidden ${styles.bg} ${styles.shadowOut}`}
                            >
                                {allPresets.map((preset) => (
                                    <div
                                        key={preset.id}
                                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer ${styles.textMain} hover:bg-brand/10`}
                                    >
                                        <span onClick={() => loadPreset(preset)} className="flex-1">
                                            {preset.name}
                                            {preset.isSystem && <span className={`ml-2 ${styles.textSub}`}>(System)</span>}
                                        </span>
                                        {!preset.isSystem && onDeletePreset && (
                                            <button
                                                onClick={() => onDeletePreset(preset.id)}
                                                className={`p-1 ${styles.textSub} hover:text-red-500`}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Save Preset Input */}
                    <AnimatePresence>
                        {showSavePreset && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 flex gap-2"
                            >
                                <input
                                    type="text"
                                    placeholder="Preset name..."
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    className={`flex-1 px-3 py-2 rounded-xl text-xs ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                                />
                                <NeuButton onClick={handleSavePreset} className="py-2 px-4 text-xs">
                                    Save
                                </NeuButton>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Format Tabs */}
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                        Format
                    </label>
                    <div className="flex gap-2">
                        {formatOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { setFormat(opt.value); setSelectedPresetId(null); }}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${format === opt.value
                                    ? 'bg-brand text-white shadow-lg shadow-brand/30'
                                    : `${styles.shadowOut} ${styles.textSub} hover:${styles.textMain}`
                                    }`}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Paper Size (PDF only) */}
                <AnimatePresence>
                    {showPaperSize && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                                Paper Size
                            </label>
                            <select
                                value={paperSize}
                                onChange={(e) => { setPaperSize(e.target.value); setSelectedPresetId(null); }}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                            >
                                {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                    <option key={key} value={key}>
                                        {size.name}{size.widthMm ? ` (${size.widthMm}×${size.heightMm}mm)` : ''}
                                    </option>
                                ))}
                            </select>

                            {/* Aspect Ratio Warning + Fit Options */}
                            <AnimatePresence>
                                {aspectMismatch && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 space-y-2"
                                    >
                                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                            <AlertTriangle size={14} />
                                            <span>Image aspect ratio differs from paper size</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {(['fit', 'fill', 'stretch'] as FitMode[]).map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setFitMode(mode)}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize ${fitMode === mode ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                                                        }`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                        <p className={`text-xs ${styles.textSub}`}>
                                            {fitMode === 'fit' && 'Image will be fully visible with background fill.'}
                                            {fitMode === 'fill' && 'Image will cover the area, edges may be cropped.'}
                                            {fitMode === 'stretch' && 'Image will be stretched to fit (may distort).'}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PDF Type */}
                <AnimatePresence>
                    {format === 'pdf' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                                PDF Type
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setPdfType('digital'); setSelectedPresetId(null); }}
                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${pdfType === 'digital' ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                                        }`}
                                >
                                    Digital (RGB)
                                </button>
                                <button
                                    onClick={() => { setPdfType('print-ready'); setSelectedPresetId(null); }}
                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${pdfType === 'print-ready' ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                                        }`}
                                >
                                    Print-Ready ✨
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Print-Ready Settings */}
                <AnimatePresence>
                    {isPrintReady && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-4 pt-2 border-t border-white/5"
                        >
                            {/* Color Space */}
                            <div>
                                <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                                    Color Space
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setColorSpace('rgb'); setSelectedPresetId(null); }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${colorSpace === 'rgb' ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                                            }`}
                                    >
                                        RGB
                                    </button>
                                    <button
                                        onClick={() => { setColorSpace('cmyk'); setSelectedPresetId(null); }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${colorSpace === 'cmyk' ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                                            }`}
                                    >
                                        CMYK
                                    </button>
                                </div>
                            </div>

                            {/* DPI */}
                            <div>
                                <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                                    Resolution
                                </label>
                                <div className="flex gap-2">
                                    {dpiOptions.map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => { setDpi(d); setSelectedPresetId(null); }}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${dpi === d ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                                                }`}
                                        >
                                            {d} DPI
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bleed */}
                            <div>
                                <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                                    Bleed
                                </label>
                                <div className="flex gap-2">
                                    {bleedOptions.map((b) => (
                                        <button
                                            key={b}
                                            onClick={() => { setBleedMm(b); setCustomBleed(''); setSelectedPresetId(null); }}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${bleedMm === b && !customBleed ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                                                }`}
                                        >
                                            {b === 0 ? 'None' : `${b}mm`}
                                        </button>
                                    ))}
                                    <input
                                        type="number"
                                        placeholder="Custom"
                                        value={customBleed}
                                        onChange={(e) => { setCustomBleed(e.target.value); setSelectedPresetId(null); }}
                                        className={`w-20 px-2 py-2 rounded-xl text-xs text-center ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                                    />
                                </div>
                            </div>

                            {/* Crop Marks */}
                            <div className="flex items-center justify-between">
                                <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSub}`}>
                                    Crop Marks
                                </label>
                                <button
                                    onClick={() => { setCropMarks(!cropMarks); setSelectedPresetId(null); }}
                                    className={`w-12 h-6 rounded-full transition-all relative ${cropMarks ? 'bg-brand' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                                        }`}
                                >
                                    <motion.div
                                        className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                                        animate={{ left: cropMarks ? 26 : 2 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Export Button */}
                <NeuButton
                    className="w-full py-4"
                    variant="primary"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download size={18} />
                            Export {format.toUpperCase()}{paperSize !== 'custom' ? ` (${PAPER_SIZES[paperSize]?.name})` : ''}
                        </>
                    )}
                </NeuButton>
            </div>
        </motion.div>
    );
};
