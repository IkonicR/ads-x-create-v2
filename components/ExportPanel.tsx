import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles, NeuButton, NeuTabs, NeuDropdown } from './NeuComponents';
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

// Preview state passed to parent for left image overlay
export interface ExportPreviewState {
    hasPreview: boolean;
    targetWidthPx: number;
    targetHeightPx: number;
    fitMode: 'fit' | 'fill' | 'stretch';
    cropOffsetX: number;
    cropOffsetY: number;
}

interface ExportPanelProps {
    imageUrl: string;
    imageAspectRatio?: number; // width / height
    onClose: () => void;
    businessName?: string;
    savedPresets?: ExportPreset[];
    onSavePreset?: (preset: ExportPreset) => void;
    onDeletePreset?: (id: string) => void;
    /** Callback to expose preview state (for left image overlay) */
    onPreviewStateChange?: (state: ExportPreviewState) => void;
    /** Callback when crop offset changes (for drag-to-reposition) */
    onCropOffsetChange?: (x: number, y: number) => void;
    /** External crop offset (controlled by parent for drag) */
    cropOffsetX?: number;
    cropOffsetY?: number;
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

// ============================================================================
// UNIFIED EXPORT PRESETS
// ============================================================================

type DimensionUnit = 'px' | 'mm' | 'cm' | 'in';

interface ExportSizePreset {
    id: string;
    name: string;
    width: number;
    height: number;
    unit: DimensionUnit;
    category: 'Custom' | 'Digital' | 'Print';
    defaultDpi: number;
}

// Unified presets for all export formats
const EXPORT_PRESETS: ExportSizePreset[] = [
    // Custom / Original
    { id: 'original', name: 'Original Size', width: 0, height: 0, unit: 'px', category: 'Custom', defaultDpi: 72 },
    { id: 'custom', name: 'Custom Dimensions', width: 0, height: 0, unit: 'px', category: 'Custom', defaultDpi: 72 },
    // Digital (pixels)
    { id: 'facebook-ad', name: 'Facebook Ad', width: 1200, height: 628, unit: 'px', category: 'Digital', defaultDpi: 72 },
    { id: 'instagram-square', name: 'Instagram Square', width: 1080, height: 1080, unit: 'px', category: 'Digital', defaultDpi: 72 },
    { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, unit: 'px', category: 'Digital', defaultDpi: 72 },
    { id: 'linkedin-ad', name: 'LinkedIn Ad', width: 1200, height: 627, unit: 'px', category: 'Digital', defaultDpi: 72 },
    { id: 'leaderboard', name: 'Leaderboard', width: 728, height: 90, unit: 'px', category: 'Digital', defaultDpi: 72 },
    { id: 'skyscraper', name: 'Skyscraper', width: 160, height: 600, unit: 'px', category: 'Digital', defaultDpi: 72 },
    { id: 'wide-skyscraper', name: 'Wide Skyscraper', width: 300, height: 600, unit: 'px', category: 'Digital', defaultDpi: 72 },
    { id: 'medium-rectangle', name: 'Medium Rectangle', width: 300, height: 250, unit: 'px', category: 'Digital', defaultDpi: 72 },
    { id: 'billboard', name: 'Billboard', width: 970, height: 250, unit: 'px', category: 'Digital', defaultDpi: 72 },
    // Print (mm)
    { id: 'a4-portrait', name: 'A4 Portrait', width: 210, height: 297, unit: 'mm', category: 'Print', defaultDpi: 300 },
    { id: 'a4-landscape', name: 'A4 Landscape', width: 297, height: 210, unit: 'mm', category: 'Print', defaultDpi: 300 },
    { id: 'a5-portrait', name: 'A5 Portrait', width: 148, height: 210, unit: 'mm', category: 'Print', defaultDpi: 300 },
    { id: 'letter-portrait', name: 'US Letter', width: 216, height: 279, unit: 'mm', category: 'Print', defaultDpi: 300 },
    { id: 'a3-portrait', name: 'A3 Portrait', width: 297, height: 420, unit: 'mm', category: 'Print', defaultDpi: 300 },
];

// Unit conversion utilities
const unitToPixels = (value: number, unit: DimensionUnit, dpi: number): number => {
    switch (unit) {
        case 'px': return Math.round(value);
        case 'mm': return Math.round((value / 25.4) * dpi);
        case 'cm': return Math.round((value / 2.54) * dpi);
        case 'in': return Math.round(value * dpi);
        default: return Math.round(value);
    }
};

const pixelsToUnit = (px: number, unit: DimensionUnit, dpi: number): number => {
    switch (unit) {
        case 'px': return px;
        case 'mm': return Math.round((px / dpi) * 25.4 * 10) / 10;
        case 'cm': return Math.round((px / dpi) * 2.54 * 10) / 10;
        case 'in': return Math.round((px / dpi) * 100) / 100;
        default: return px;
    }
};

const UNIT_LABELS: Record<DimensionUnit, string> = { px: 'px', mm: 'mm', cm: 'cm', in: 'in' };

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
    onPreviewStateChange,
    onCropOffsetChange,
    cropOffsetX: externalCropOffsetX,
    cropOffsetY: externalCropOffsetY,
}) => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

    // Export settings state
    const [format, setFormat] = useState<ExportFormat>('png');
    const [pdfType, setPdfType] = useState<PDFType>('digital');
    const [colorSpace, setColorSpace] = useState<ColorSpace>('rgb');
    const [bleedMm, setBleedMm] = useState(0);
    const [customBleed, setCustomBleed] = useState('');
    const [cropMarks, setCropMarks] = useState(false);
    const [fitMode, setFitMode] = useState<FitMode>('fit');
    const [isExporting, setIsExporting] = useState(false);

    // Unified dimension state
    const [selectedPreset, setSelectedPreset] = useState<string>('original');
    const [dimensionWidth, setDimensionWidth] = useState('');
    const [dimensionHeight, setDimensionHeight] = useState('');
    const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>('px');
    // Use external offset if provided, else internal state
    const [internalCropOffsetX, setInternalCropOffsetX] = useState(0.5);
    const [internalCropOffsetY, setInternalCropOffsetY] = useState(0.5);
    const cropOffsetX = externalCropOffsetX ?? internalCropOffsetX;
    const cropOffsetY = externalCropOffsetY ?? internalCropOffsetY;
    const setCropOffsetX = onCropOffsetChange
        ? (x: number) => onCropOffsetChange(x, cropOffsetY)
        : setInternalCropOffsetX;
    const setCropOffsetY = onCropOffsetChange
        ? (y: number) => onCropOffsetChange(cropOffsetX, y)
        : setInternalCropOffsetY;

    // Default DPI based on format: PDF=300, others=72
    const defaultDpi = format === 'pdf' ? 300 : 72;
    const [dpi, setDpi] = useState(defaultDpi);

    // Preset state
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);
    const [showSavePreset, setShowSavePreset] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');

    const allPresets = useMemo(() => [...SYSTEM_PRESETS, ...savedPresets], [savedPresets]);
    const isPrintReady = format === 'pdf' && pdfType === 'print-ready';
    const effectiveBleed = customBleed ? parseInt(customBleed, 10) : bleedMm;

    // Calculate target dimensions in pixels
    const targetWidthPx = useMemo(() => {
        const w = parseFloat(dimensionWidth);
        if (!w || w <= 0) return 0;
        return unitToPixels(w, dimensionUnit, dpi);
    }, [dimensionWidth, dimensionUnit, dpi]);

    const targetHeightPx = useMemo(() => {
        const h = parseFloat(dimensionHeight);
        if (!h || h <= 0) return 0;
        return unitToPixels(h, dimensionUnit, dpi);
    }, [dimensionHeight, dimensionUnit, dpi]);

    // Check if we have valid dimensions set
    const hasTargetDimensions = targetWidthPx > 0 && targetHeightPx > 0;
    const targetAspectRatio = hasTargetDimensions ? targetWidthPx / targetHeightPx : imageAspectRatio;
    const aspectMismatch = hasTargetDimensions && Math.abs(imageAspectRatio - targetAspectRatio) > 0.05;

    // Notify parent of preview state changes (for left image overlay)
    useEffect(() => {
        onPreviewStateChange?.({
            hasPreview: aspectMismatch,
            targetWidthPx,
            targetHeightPx,
            fitMode,
            cropOffsetX,
            cropOffsetY,
        });
    }, [aspectMismatch, targetWidthPx, targetHeightPx, fitMode, cropOffsetX, cropOffsetY, onPreviewStateChange]);

    // Load preset
    const loadPreset = (preset: ExportPreset) => {
        setFormat(preset.format);
        if (preset.pdfType) setPdfType(preset.pdfType);
        if (preset.colorSpace) setColorSpace(preset.colorSpace);
        if (preset.dpi) setDpi(preset.dpi);
        if (preset.bleedMm !== undefined) setBleedMm(preset.bleedMm);
        if (preset.cropMarks !== undefined) setCropMarks(preset.cropMarks);
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
            dpi: dpi,
            bleedMm: isPrintReady ? effectiveBleed : undefined,
            cropMarks: isPrintReady ? cropMarks : undefined,
            fitMode: hasTargetDimensions ? fitMode : undefined,
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
                    dpi,
                    bleedMm: isPrintReady ? effectiveBleed : 0,
                    cropMarks: isPrintReady ? cropMarks : false,
                    fitMode: hasTargetDimensions ? fitMode : 'fit',
                    // Pass pixel dimensions (already calculated above)
                    ...(hasTargetDimensions && {
                        customWidthPx: targetWidthPx,
                        customHeightPx: targetHeightPx,
                        cropOffsetX: fitMode === 'fill' ? (1 - cropOffsetX) : 0.5,
                        cropOffsetY: fitMode === 'fill' ? (1 - cropOffsetY) : 0.5,
                    }),
                }),
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = format === 'pdf' ? 'pdf' : format;
            // Include dimensions in filename when using custom sizes
            const dimensionSuffix = hasTargetDimensions
                ? `-${targetWidthPx}x${targetHeightPx}`
                : (selectedPreset !== 'original' ? `-${selectedPreset}` : '');
            a.download = `${businessName || 'export'}${dimensionSuffix}.${ext}`;
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
        <div className="h-full flex flex-col overflow-hidden">
            <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${styles.textMain}`}>
                        Export Settings
                    </h4>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-transform active:scale-95 group ${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-red-500`}
                    >
                        <X size={20} className="transition-transform duration-300 group-hover:rotate-90" />
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
                        <NeuTabs
                            tabs={formatOptions.map(opt => ({
                                id: opt.value,
                                label: opt.label, // Remove icon to save space if needed, or keep
                                icon: opt.icon
                            }))}
                            activeTab={format}
                            onChange={(id) => { setFormat(id as ExportFormat); setSelectedPresetId(null); }}
                            className="w-full"
                            layoutId="exportFormat"
                        />
                    </div>
                </div>

                {/* Unified Target Size Section */}
                <div className="space-y-3">
                    <label className={`text-xs font-bold uppercase tracking-wider block ${styles.textSub}`}>
                        Target Size
                    </label>

                    {/* Preset Selector - using NeuDropdown */}
                    <NeuDropdown
                        options={EXPORT_PRESETS.map(p => ({
                            value: p.id,
                            label: p.width > 0
                                ? `${p.name} (${p.width}×${p.height}${p.unit})`
                                : p.name
                        }))}
                        value={selectedPreset}
                        onChange={(id) => {
                            setSelectedPreset(id);
                            setSelectedPresetId(null);
                            // Auto-fill dimensions from preset
                            const preset = EXPORT_PRESETS.find(p => p.id === id);
                            if (preset && preset.width > 0) {
                                setDimensionWidth(preset.width.toString());
                                setDimensionHeight(preset.height.toString());
                                setDimensionUnit(preset.unit);
                                setDpi(preset.defaultDpi);
                            } else {
                                setDimensionWidth('');
                                setDimensionHeight('');
                            }
                        }}
                        placeholder="Select size..."
                        overlay
                    />

                    {/* Custom dimension inputs with unit selector */}
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            placeholder="Width"
                            value={dimensionWidth}
                            onChange={(e) => {
                                setDimensionWidth(e.target.value);
                                setSelectedPreset('custom');
                                setSelectedPresetId(null);
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs text-center ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                        />
                        <span className={`text-xs ${styles.textSub}`}>×</span>
                        <input
                            type="number"
                            placeholder="Height"
                            value={dimensionHeight}
                            onChange={(e) => {
                                setDimensionHeight(e.target.value);
                                setSelectedPreset('custom');
                                setSelectedPresetId(null);
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs text-center ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                        />
                        {/* Unit selector - NeuDropdown compact */}
                        <NeuDropdown
                            options={[
                                { value: 'px', label: 'px' },
                                { value: 'mm', label: 'mm' },
                                { value: 'cm', label: 'cm' },
                                { value: 'in', label: 'in' },
                            ]}
                            value={dimensionUnit}
                            onChange={(newUnit) => {
                                const oldUnit = dimensionUnit;
                                const w = parseFloat(dimensionWidth);
                                const h = parseFloat(dimensionHeight);
                                // Convert values when changing units (preserve visual size)
                                if (w > 0 && h > 0) {
                                    const wPx = unitToPixels(w, oldUnit, dpi);
                                    const hPx = unitToPixels(h, oldUnit, dpi);
                                    const newW = pixelsToUnit(wPx, newUnit as DimensionUnit, dpi);
                                    const newH = pixelsToUnit(hPx, newUnit as DimensionUnit, dpi);
                                    setDimensionWidth(newW.toString());
                                    setDimensionHeight(newH.toString());
                                }
                                setDimensionUnit(newUnit as DimensionUnit);
                            }}
                            overlay
                            compact
                            className="w-20"
                        />
                    </div>

                    {/* Real-time pixel output display */}
                    {hasTargetDimensions && (
                        <p className={`text-xs ${styles.textSub}`}>
                            Output: <span className={`font-bold ${styles.textMain}`}>{targetWidthPx}×{targetHeightPx}px</span> @ {dpi} DPI
                        </p>
                    )}

                    {/* Fit mode selector (show when dimensions set and aspect differs) */}
                    <AnimatePresence>
                        {aspectMismatch && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-2"
                            >
                                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    <AlertTriangle size={14} />
                                    <span>Aspect ratio differs from image</span>
                                </div>
                                <NeuTabs
                                    tabs={(['fit', 'fill', 'stretch'] as FitMode[]).map(mode => ({
                                        id: mode,
                                        label: mode.charAt(0).toUpperCase() + mode.slice(1)
                                    }))}
                                    activeTab={fitMode}
                                    onChange={(id) => setFitMode(id as FitMode)}
                                    className="w-full"
                                    layoutId="fitModeUnified"
                                />
                                <p className={`text-xs ${styles.textSub}`}>
                                    {fitMode === 'fit' && 'Image will be fully visible with background fill.'}
                                    {fitMode === 'fill' && 'Image will cover the area, edges may be cropped.'}
                                    {fitMode === 'stretch' && 'Image will be stretched to fit (may distort).'}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

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
                                <NeuTabs
                                    tabs={[
                                        { id: 'digital', label: 'Digital' }, // Shortened label for better fit
                                        { id: 'print-ready', label: 'Print' } // Shortened label
                                    ]}
                                    activeTab={pdfType}
                                    onChange={(id) => { setPdfType(id as PDFType); setSelectedPresetId(null); }}
                                    className="w-full"
                                    layoutId="pdfType"
                                />
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
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${colorSpace === 'rgb' ? `bg-brand text-white ${styles.shadowIn}` : `${styles.shadowOut} ${styles.textSub}`
                                            }`}
                                    >
                                        RGB
                                    </button>
                                    <button
                                        onClick={() => { setColorSpace('cmyk'); setSelectedPresetId(null); }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${colorSpace === 'cmyk' ? `bg-brand text-white ${styles.shadowIn}` : `${styles.shadowOut} ${styles.textSub}`
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
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${dpi === d ? `bg-brand text-white ${styles.shadowIn}` : `${styles.shadowOut} ${styles.textSub}`
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
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${bleedMm === b && !customBleed ? `bg-brand text-white ${styles.shadowIn}` : `${styles.shadowOut} ${styles.textSub}`
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
                            Export {format.toUpperCase()}{hasTargetDimensions ? ` (${targetWidthPx}×${targetHeightPx})` : ''}
                        </>
                    )}
                </NeuButton>
            </div>
        </div>
    );
};
