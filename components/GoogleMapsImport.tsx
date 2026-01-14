import React, { useState, useEffect, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useThemeStyles, NeuInput, NeuButton } from './NeuComponents';
import { Search, Loader2, MapPin, Phone, Globe, Clock, ChevronDown, ChevronUp, Check, X, Building2, AlertTriangle, Tag, MapPinned } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseGoogleHours, BusinessHour } from '../utils/parseGoogleHours';

const libraries: ("places")[] = ["places"];

export interface GoogleMapsImportData {
    name?: string;
    address?: string;
    phone?: string;
    website?: string;
    hours?: BusinessHour[];
    category?: string;       // NEW: Maps to business.industry
    compactAddress?: string; // NEW: Maps to profile.publicLocationLabel
}

interface PreviewField {
    key: 'name' | 'address' | 'phone' | 'website' | 'hours' | 'category' | 'compactAddress';
    label: string;
    icon: React.ReactNode;
    value: string;
    hasConflict: boolean;
    currentValue?: string;
    rawData: any;
    existingAs?: string; // For smart duplicate detection: "Already saved as WhatsApp"
}

interface GoogleMapsImportProps {
    currentData: {
        name?: string;
        address?: string;
        phone?: string;
        website?: string;
        hours?: BusinessHour[];
        allContacts?: { type: string; value: string; label?: string }[];
        industry?: string;           // NEW: For category conflict detection
        publicLocationLabel?: string; // NEW: For compact address conflict detection
    };
    onImport: (data: GoogleMapsImportData) => void;
    defaultExpanded?: boolean;
}

// Helper to format hours summary
interface HoursSummary {
    text: string;
    hasSplitShifts: boolean;
    openDayCount: number;
}

function formatHoursPreview(hours: BusinessHour[]): HoursSummary {
    const openDays = hours.filter(h => !h.closed);
    const hasSplitShifts = hours.some(h => h.slots && h.slots.length > 1);

    if (openDays.length === 0) {
        return { text: 'No hours listed', hasSplitShifts: false, openDayCount: 0 };
    }

    let text = `${openDays.length} day${openDays.length > 1 ? 's' : ''} open`;
    if (hasSplitShifts) {
        text += ', includes split hours';
    }

    return { text, hasSplitShifts, openDayCount: openDays.length };
}

// Format a single day's slots for display
function formatDaySlots(hour: BusinessHour): string {
    if (hour.closed) return 'Closed';
    if (!hour.slots || hour.slots.length === 0) return `${hour.open} - ${hour.close}`;
    return hour.slots.map(s => `${s.open} - ${s.close}`).join(', ');
}

// Smart hours comparison - compares actual time values, not object structure
function hoursAreEquivalent(existing: BusinessHour[] | undefined, imported: BusinessHour[]): boolean {
    if (!existing || existing.length === 0) return false;
    if (existing.length !== imported.length) return false;

    // Map by day for easier comparison
    const existingMap = new Map(existing.map(h => [h.day, h]));

    for (const imp of imported) {
        const ext = existingMap.get(imp.day);
        if (!ext) return false;

        // Compare closed status
        if (ext.closed !== imp.closed) return false;

        // If both closed, this day matches
        if (ext.closed && imp.closed) continue;

        // Compare slots if available, otherwise compare open/close
        const extSlots = ext.slots && ext.slots.length > 0 ? ext.slots : [{ open: ext.open, close: ext.close }];
        const impSlots = imp.slots && imp.slots.length > 0 ? imp.slots : [{ open: imp.open, close: imp.close }];

        if (extSlots.length !== impSlots.length) return false;

        // Sort slots by open time for consistent comparison
        const sortedExt = [...extSlots].sort((a, b) => a.open.localeCompare(b.open));
        const sortedImp = [...impSlots].sort((a, b) => a.open.localeCompare(b.open));

        for (let i = 0; i < sortedExt.length; i++) {
            if (sortedExt[i].open !== sortedImp[i].open) return false;
            if (sortedExt[i].close !== sortedImp[i].close) return false;
        }
    }

    return true;
}

export const GoogleMapsImport: React.FC<GoogleMapsImportProps> = ({
    currentData,
    onImport,
    defaultExpanded = false,
}) => {
    const { styles } = useThemeStyles();
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [inputValue, setInputValue] = useState('');
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Preview state
    const [previewData, setPreviewData] = useState<PreviewField[] | null>(null);
    const [selectedBusiness, setSelectedBusiness] = useState<string>('');
    const [importSuccess, setImportSuccess] = useState(false);
    const [hoursExpanded, setHoursExpanded] = useState(false);

    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "",
        libraries,
        id: 'google-map-script',
        nonce: 'google-map-script',
    });

    useEffect(() => {
        if (isLoaded && window.google && !autocompleteService.current) {
            autocompleteService.current = new google.maps.places.AutocompleteService();
            sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        }
    }, [isLoaded]);

    // Fetch predictions
    useEffect(() => {
        if (!inputValue || inputValue.length < 3) {
            setPredictions([]);
            return;
        }

        const timer = setTimeout(() => {
            if (autocompleteService.current) {
                autocompleteService.current.getPlacePredictions(
                    {
                        input: inputValue,
                        sessionToken: sessionToken.current || undefined,
                        types: ['establishment'],
                    },
                    (results, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                            setPredictions(results);
                            setShowDropdown(true);
                        } else {
                            setPredictions([]);
                        }
                    }
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue]);

    const handleSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
        setSelectedBusiness(prediction.structured_formatting.main_text);
        setInputValue('');
        setShowDropdown(false);
        setIsLoading(true);
        setPreviewData(null);

        try {
            if (!window.google?.maps?.places?.Place) {
                throw new Error("Google Maps Places API (New) is not available.");
            }

            const place = new google.maps.places.Place({
                id: prediction.place_id,
                requestedLanguage: 'en',
            });

            await place.fetchFields({
                fields: [
                    'displayName',
                    'formattedAddress',
                    'shortFormattedAddress',  // NEW: Compact address
                    'nationalPhoneNumber',
                    'websiteURI',
                    'regularOpeningHours',
                    'primaryType',            // NEW: Category (e.g., "pharmacy")
                    'primaryTypeDisplayName', // NEW: Localized category name
                ],
            });

            // Build preview fields
            const fields: PreviewField[] = [];

            // Name
            if (place.displayName) {
                const hasConflict = !!currentData.name && currentData.name !== place.displayName && currentData.name !== 'New Business';
                fields.push({
                    key: 'name',
                    label: 'Business Name',
                    icon: <Building2 size={16} />,
                    value: place.displayName,
                    hasConflict,
                    currentValue: hasConflict ? currentData.name : undefined,
                    rawData: place.displayName,
                });
            }

            // Address
            if (place.formattedAddress) {
                const hasConflict = !!currentData.address && currentData.address !== place.formattedAddress;
                fields.push({
                    key: 'address',
                    label: 'Address',
                    icon: <MapPin size={16} />,
                    value: place.formattedAddress,
                    hasConflict,
                    currentValue: hasConflict ? currentData.address : undefined,
                    rawData: place.formattedAddress,
                });
            }

            // Compact Address (for publicLocationLabel)
            const shortAddress = (place as any).shortFormattedAddress;
            if (shortAddress) {
                const existingLabel = currentData.publicLocationLabel;
                const hasConflict = !!existingLabel && existingLabel.toLowerCase() !== shortAddress.toLowerCase();
                fields.push({
                    key: 'compactAddress',
                    label: 'Compact Address',
                    icon: <MapPinned size={16} />,
                    value: shortAddress,
                    hasConflict,
                    currentValue: hasConflict ? existingLabel : undefined,
                    rawData: shortAddress,
                });
            }

            // Category (for industry)
            const categoryName = (place as any).primaryTypeDisplayName?.text || (place as any).primaryType;
            if (categoryName) {
                // Capitalize first letter for display
                const displayCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/_/g, ' ');
                const existingIndustry = currentData.industry;
                const hasConflict = !!existingIndustry && existingIndustry.toLowerCase() !== displayCategory.toLowerCase();
                fields.push({
                    key: 'category',
                    label: 'Category',
                    icon: <Tag size={16} />,
                    value: displayCategory,
                    hasConflict,
                    currentValue: hasConflict ? existingIndustry : undefined,
                    rawData: displayCategory,
                });
            }

            // Phone - with smart duplicate detection
            if (place.nationalPhoneNumber) {
                const phoneValue = place.nationalPhoneNumber;
                const normalizedPhone = phoneValue.replace(/[\s\-\(\)]/g, ''); // Remove formatting for comparison

                // Check if this phone exists in any contact type
                const existingContact = currentData.allContacts?.find(c => {
                    const normalizedExisting = c.value.replace(/[\s\-\(\)]/g, '');
                    return normalizedExisting === normalizedPhone || c.value === phoneValue;
                });

                const exactPhoneMatch = currentData.phone === phoneValue;
                const existsAsOtherType = existingContact && existingContact.type !== 'phone';

                if (existsAsOtherType) {
                    // Phone exists but as different type (e.g., WhatsApp)
                    const typeLabel = existingContact.label || existingContact.type.charAt(0).toUpperCase() + existingContact.type.slice(1);
                    fields.push({
                        key: 'phone',
                        label: 'Phone',
                        icon: <Phone size={16} />,
                        value: phoneValue,
                        hasConflict: false,
                        existingAs: `Already saved as ${typeLabel}`,
                        rawData: null, // Don't import, already exists
                    });
                } else if (!exactPhoneMatch && !existingContact) {
                    // New phone number
                    fields.push({
                        key: 'phone',
                        label: 'Phone',
                        icon: <Phone size={16} />,
                        value: phoneValue,
                        hasConflict: !!currentData.phone,
                        currentValue: currentData.phone || undefined,
                        rawData: phoneValue,
                    });
                } else if (!exactPhoneMatch && currentData.phone) {
                    // Different phone exists
                    fields.push({
                        key: 'phone',
                        label: 'Phone',
                        icon: <Phone size={16} />,
                        value: phoneValue,
                        hasConflict: true,
                        currentValue: currentData.phone,
                        rawData: phoneValue,
                    });
                }
                // If exactPhoneMatch, skip - already have this exact phone
            }

            // Website - with smart duplicate detection
            if (place.websiteURI) {
                const websiteValue = place.websiteURI;
                const normalizedWebsite = websiteValue.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

                // Check if this website exists in any contact type
                const existingContact = currentData.allContacts?.find(c => {
                    const normalizedExisting = c.value.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
                    return normalizedExisting === normalizedWebsite;
                });

                const exactWebsiteMatch = currentData.website &&
                    currentData.website.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase() === normalizedWebsite;
                const existsAsOtherType = existingContact && existingContact.type !== 'website';

                if (existsAsOtherType) {
                    const typeLabel = existingContact.label || existingContact.type.charAt(0).toUpperCase() + existingContact.type.slice(1);
                    fields.push({
                        key: 'website',
                        label: 'Website',
                        icon: <Globe size={16} />,
                        value: normalizedWebsite,
                        hasConflict: false,
                        existingAs: `Already saved as ${typeLabel}`,
                        rawData: null,
                    });
                } else if (!exactWebsiteMatch && !existingContact) {
                    fields.push({
                        key: 'website',
                        label: 'Website',
                        icon: <Globe size={16} />,
                        value: normalizedWebsite,
                        hasConflict: !!currentData.website,
                        currentValue: currentData.website || undefined,
                        rawData: websiteValue,
                    });
                } else if (!exactWebsiteMatch && currentData.website) {
                    fields.push({
                        key: 'website',
                        label: 'Website',
                        icon: <Globe size={16} />,
                        value: normalizedWebsite,
                        hasConflict: true,
                        currentValue: currentData.website,
                        rawData: websiteValue,
                    });
                }
            }

            // Hours
            const openingHours = place.regularOpeningHours as any;
            if (openingHours?.weekdayDescriptions) {
                const parsedHours = parseGoogleHours(openingHours.weekdayDescriptions);
                const hasExistingHours = currentData.hours && currentData.hours.some(h => !h.closed);
                const hoursMatch = hasExistingHours && hoursAreEquivalent(currentData.hours, parsedHours);
                const summary = formatHoursPreview(parsedHours);
                fields.push({
                    key: 'hours',
                    label: 'Opening Hours',
                    icon: <Clock size={16} />,
                    value: summary.text,
                    hasConflict: hasExistingHours && !hoursMatch,
                    currentValue: hasExistingHours && !hoursMatch ? 'Custom hours set' : undefined,
                    rawData: parsedHours,
                });
            }

            setPreviewData(fields);
            setIsLoading(false);

        } catch (error) {
            console.error('🚨 Failed to fetch place details:', error);
            setIsLoading(false);
        }
    };

    const handleResolveConflict = (fieldKey: string, useGoogle: boolean) => {
        if (!previewData) return;
        setPreviewData(prev =>
            prev?.map(field =>
                field.key === fieldKey
                    ? { ...field, hasConflict: false, useGoogleValue: useGoogle } as any
                    : field
            ) || null
        );
    };

    const handleImportAll = () => {
        if (!previewData) return;

        const importData: GoogleMapsImportData = {};

        for (const field of previewData) {
            // Skip fields where user chose to keep their own value
            if ((field as any).useGoogleValue === false) continue;

            // Include field if no conflict or user chose Google value
            if (!field.hasConflict || (field as any).useGoogleValue === true) {
                (importData as any)[field.key] = field.rawData;
            }
        }

        // Trigger success animation
        setImportSuccess(true);

        // Wait for animation, then import and collapse
        setTimeout(() => {
            onImport(importData);
            setImportSuccess(false);
            setPreviewData(null);
            setSelectedBusiness('');
            setIsExpanded(false);
        }, 1200);
    };

    const handleCancel = () => {
        setPreviewData(null);
        setSelectedBusiness('');
        setInputValue('');
    };

    const hasUnresolvedConflicts = previewData?.some(f => f.hasConflict) || false;

    if (!isLoaded) return null;

    // Animation variants
    const containerVariants = {
        collapsed: { height: 0, opacity: 0 },
        expanded: { height: 'auto', opacity: 1 },
    };

    const rowVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: { delay: i * 0.05, duration: 0.2 },
        }),
    };

    const successVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 20 }
        },
    };

    return (
        <div className={`rounded-2xl border ${styles.border} ${styles.bgAccent} overflow-hidden transition-shadow ${importSuccess ? 'shadow-[0_0_30px_rgba(34,197,94,0.3)]' : ''}`}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full px-5 py-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 text-white`}>
                        <MapPin size={20} />
                    </div>
                    <div className="text-left">
                        <div className={`font-bold ${styles.textMain}`}>Quick Setup from Google Maps</div>
                        <div className={`text-xs ${styles.textSub}`}>Import name, address, phone, website & hours</div>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={20} className={styles.textSub} />
                </motion.div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        variants={containerVariants}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-4 space-y-4">

                            {/* Search Input - only show if no preview */}
                            {!previewData && !isLoading && (
                                <div className="relative">
                                    <NeuInput
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onFocus={() => { if (predictions.length > 0) setShowDropdown(true); }}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                        placeholder="Search your business on Google Maps..."
                                        className="pl-10"
                                    />
                                    <div className={`absolute left-3 top-3.5 ${styles.textSub}`}>
                                        <Search size={18} />
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-center gap-3 py-8"
                                >
                                    <Loader2 size={24} className="animate-spin text-brand" />
                                    <span className={`text-sm ${styles.textSub}`}>Fetching business details...</span>
                                </motion.div>
                            )}

                            {/* Predictions Dropdown */}
                            <AnimatePresence>
                                {showDropdown && predictions.length > 0 && !previewData && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`rounded-xl ${styles.bg} ${styles.shadowOut} border ${styles.border} overflow-hidden`}
                                    >
                                        {predictions.slice(0, 7).map((prediction) => (
                                            <button
                                                key={prediction.place_id}
                                                onClick={() => handleSelect(prediction)}
                                                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-brand/5 transition-colors border-b ${styles.border} last:border-0`}
                                            >
                                                <div className={`mt-0.5 p-1.5 rounded-full ${styles.shadowIn} text-brand`}>
                                                    <MapPin size={12} />
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-bold ${styles.textMain}`}>
                                                        {prediction.structured_formatting.main_text}
                                                    </div>
                                                    <div className={`text-xs ${styles.textSub}`}>
                                                        {prediction.structured_formatting.secondary_text}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Preview Card */}
                            <AnimatePresence>
                                {previewData && !importSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className={`rounded-xl ${styles.bg} ${styles.shadowOut} border ${styles.border} overflow-hidden`}
                                    >
                                        {/* Preview Header */}
                                        <div className={`px-4 py-3 border-b ${styles.border} flex items-center gap-2`}>
                                            <div className="p-1.5 rounded-full bg-green-500/10 text-green-500">
                                                <Check size={14} />
                                            </div>
                                            <span className={`text-sm font-bold ${styles.textMain}`}>
                                                Found: {selectedBusiness}
                                            </span>
                                        </div>

                                        {/* Preview Fields */}
                                        <div className="p-4 space-y-3">
                                            {previewData.map((field, index) => (
                                                <motion.div
                                                    key={field.key}
                                                    custom={index}
                                                    initial="hidden"
                                                    animate="visible"
                                                    variants={rowVariants}
                                                    className="space-y-2"
                                                >
                                                    <div className={`flex items-start gap-3 ${field.hasConflict ? 'pb-2' : ''}`}>
                                                        <div className={`p-2 rounded-lg ${styles.bgAccent} ${styles.textSub}`}>
                                                            {field.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-[10px] uppercase tracking-wider ${styles.textSub} mb-0.5`}>
                                                                {field.label}
                                                            </div>
                                                            <div className={`text-sm ${styles.textMain}`}>
                                                                {field.key === 'hours' ? (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span>{field.value}</span>
                                                                            <button
                                                                                onClick={() => setHoursExpanded(!hoursExpanded)}
                                                                                className="text-brand text-xs hover:underline flex items-center gap-1"
                                                                            >
                                                                                {hoursExpanded ? 'Hide' : 'View details'}
                                                                                <motion.span
                                                                                    animate={{ rotate: hoursExpanded ? 180 : 0 }}
                                                                                    transition={{ duration: 0.2 }}
                                                                                >
                                                                                    <ChevronDown size={12} />
                                                                                </motion.span>
                                                                            </button>
                                                                        </div>
                                                                        <AnimatePresence>
                                                                            {hoursExpanded && field.rawData && (
                                                                                <motion.div
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    transition={{ duration: 0.2 }}
                                                                                    className="overflow-hidden"
                                                                                >
                                                                                    <div className={`p-3 rounded-lg ${styles.bgAccent} border ${styles.border} space-y-1.5`}>
                                                                                        {(field.rawData as BusinessHour[]).map((hour) => (
                                                                                            <div key={hour.day} className="flex justify-between text-xs">
                                                                                                <span className={`font-bold ${styles.textSub} w-10`}>{hour.day}</span>
                                                                                                <span className={hour.closed ? styles.textSub : styles.textMain}>
                                                                                                    {formatDaySlots(hour)}
                                                                                                </span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                ) : (
                                                                    <span className="truncate">{field.value}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Status indicator */}
                                                        {!field.hasConflict && (
                                                            <div className="flex items-center gap-2">
                                                                {/* Show "Already saved as X" for smart duplicate detection */}
                                                                {field.existingAs && (
                                                                    <span className={`text-xs ${styles.textSub}`}>
                                                                        {field.existingAs}
                                                                    </span>
                                                                )}
                                                                {/* Show "Keeping yours" when user chose to keep their value */}
                                                                {(field as any).useGoogleValue === false && field.currentValue && (
                                                                    <span className={`text-xs ${styles.textSub}`}>
                                                                        Keeping yours
                                                                    </span>
                                                                )}
                                                                <div className="p-1 rounded-full text-green-500">
                                                                    <Check size={14} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Show "Keeping: your value" when Keep Mine was selected */}
                                                    {(field as any).useGoogleValue === false && field.currentValue && field.key !== 'hours' && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className={`ml-9 mt-1 text-xs ${styles.textSub}`}
                                                        >
                                                            <span className="line-through opacity-50">{field.value}</span>
                                                            <span className="mx-2">→</span>
                                                            <span className={`font-bold ${styles.textMain}`}>{field.currentValue}</span>
                                                        </motion.div>
                                                    )}

                                                    {/* Conflict Resolution */}
                                                    {field.hasConflict && (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className={`ml-9 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20`}
                                                        >
                                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs mb-2">
                                                                <AlertTriangle size={12} />
                                                                <span>Different from yours: {field.currentValue}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleResolveConflict(field.key, true)}
                                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                                                                >
                                                                    Use Google
                                                                </button>
                                                                <button
                                                                    onClick={() => handleResolveConflict(field.key, false)}
                                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${styles.bgAccent} ${styles.textSub} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                                                                >
                                                                    Keep Mine
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className={`px-4 py-3 border-t ${styles.border} flex gap-3`}>
                                            <NeuButton
                                                onClick={handleImportAll}
                                                disabled={hasUnresolvedConflicts}
                                                className={`flex-1 ${hasUnresolvedConflicts ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Check size={16} className="mr-2" />
                                                {hasUnresolvedConflicts ? 'Resolve conflicts first' : 'Import All'}
                                            </NeuButton>
                                            <button
                                                onClick={handleCancel}
                                                className={`px-4 py-2 rounded-xl ${styles.textSub} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Success Animation */}
                            <AnimatePresence>
                                {importSuccess && (
                                    <motion.div
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        variants={successVariants}
                                        className="flex flex-col items-center justify-center py-10"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                                            className={`w-16 h-16 rounded-full ${styles.bg} ${styles.shadowOut} flex items-center justify-center mb-4`}
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="text-green-500"
                                            >
                                                <Check size={32} strokeWidth={3} />
                                            </motion.div>
                                        </motion.div>
                                        <motion.span
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className={`text-base font-bold ${styles.textMain}`}
                                        >
                                            Imported!
                                        </motion.span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Helper Text */}
                            {!isLoading && !previewData && predictions.length === 0 && inputValue.length === 0 && (
                                <div className={`flex items-center gap-2 text-xs ${styles.textSub}`}>
                                    <div className="flex gap-1.5">
                                        <Phone size={12} />
                                        <Globe size={12} />
                                        <Clock size={12} />
                                    </div>
                                    <span>We'll import all available details from your Google Business listing</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
