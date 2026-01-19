import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from './NeuComponents';
import { Move } from 'lucide-react';

interface ExportPreviewProps {
    imageUrl: string;
    targetWidthPx: number;
    targetHeightPx: number;
    imageAspectRatio: number;
    fitMode: 'fit' | 'fill' | 'stretch';
    cropOffsetX: number; // 0-1 (0=left, 0.5=center, 1=right)
    cropOffsetY: number; // 0-1 (0=top, 0.5=center, 1=bottom)
    onCropOffsetChange: (x: number, y: number) => void;
}

/**
 * Live preview of export result.
 * Shows what the final image will look like based on target dimensions and fit mode.
 * For Fill mode: allows drag-to-reposition.
 */
export const ExportPreview: React.FC<ExportPreviewProps> = ({
    imageUrl,
    targetWidthPx,
    targetHeightPx,
    imageAspectRatio,
    fitMode,
    cropOffsetX,
    cropOffsetY,
    onCropOffsetChange,
}) => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Calculate target aspect ratio
    const targetAspectRatio = targetWidthPx / targetHeightPx;

    // Preview container size (fit within max width, maintain target aspect)
    const maxPreviewWidth = 280;
    const previewWidth = maxPreviewWidth;
    const previewHeight = previewWidth / targetAspectRatio;

    // Calculate how image fits/fills the frame
    const imageIsWider = imageAspectRatio > targetAspectRatio;

    // For Fill mode: image covers frame, excess is cropped
    // Calculate scale factor and overflow
    let imageStyle: React.CSSProperties = {};

    if (fitMode === 'fit') {
        // Contain: image fully visible, letterboxed
        imageStyle = {
            objectFit: 'contain',
            width: '100%',
            height: '100%',
        };
    } else if (fitMode === 'fill') {
        // Cover: image covers frame, positioned by offset
        const scaleX = 1 / targetAspectRatio * imageAspectRatio;
        const scaleY = targetAspectRatio / imageAspectRatio;

        if (imageIsWider) {
            // Image is wider than target - horizontal overflow
            const overflow = (scaleX - 1) * 100;
            imageStyle = {
                objectFit: 'cover',
                width: `${scaleX * 100}%`,
                height: '100%',
                left: `${-overflow * cropOffsetX}%`,
                top: 0,
                position: 'absolute',
            };
        } else {
            // Image is taller than target - vertical overflow
            const overflow = (scaleY - 1) * 100;
            imageStyle = {
                objectFit: 'cover',
                width: '100%',
                height: `${scaleY * 100}%`,
                left: 0,
                top: `${-overflow * cropOffsetY}%`,
                position: 'absolute',
            };
        }
    } else if (fitMode === 'stretch') {
        // Fill: stretch to exact dimensions
        imageStyle = {
            objectFit: 'fill',
            width: '100%',
            height: '100%',
        };
    }

    // Drag handlers for Fill mode
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (fitMode !== 'fill') return;
        e.preventDefault();
        setIsDragging(true);
    }, [fitMode]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || fitMode !== 'fill' || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        if (imageIsWider) {
            // Horizontal drag
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onCropOffsetChange(x, cropOffsetY);
        } else {
            // Vertical drag
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            onCropOffsetChange(cropOffsetX, y);
        }
    }, [isDragging, fitMode, imageIsWider, cropOffsetX, cropOffsetY, onCropOffsetChange]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Touch handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (fitMode !== 'fill') return;
        setIsDragging(true);
    }, [fitMode]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || fitMode !== 'fill' || !containerRef.current) return;

        const touch = e.touches[0];
        const rect = containerRef.current.getBoundingClientRect();

        if (imageIsWider) {
            const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
            onCropOffsetChange(x, cropOffsetY);
        } else {
            const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
            onCropOffsetChange(cropOffsetX, y);
        }
    }, [isDragging, fitMode, imageIsWider, cropOffsetX, cropOffsetY, onCropOffsetChange]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2"
        >
            {/* Preview Label */}
            <div className={`flex items-center justify-between text-xs ${styles.textSub}`}>
                <span className="font-bold uppercase tracking-wider">Preview</span>
                {fitMode === 'fill' && (
                    <span className="flex items-center gap-1 opacity-70">
                        <Move size={12} />
                        Drag to reposition
                    </span>
                )}
            </div>

            {/* Preview Frame */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`
                    relative overflow-hidden rounded-xl mx-auto
                    ${styles.shadowIn}
                    ${fitMode === 'fill' ? 'cursor-grab active:cursor-grabbing' : ''}
                    ${isDark ? 'bg-neutral-800' : 'bg-white'}
                `}
                style={{
                    width: previewWidth,
                    height: previewHeight,
                    maxHeight: 300,
                }}
            >
                {/* Background for Fit mode letterboxing */}
                {fitMode === 'fit' && (
                    <div className={`absolute inset-0 ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`} />
                )}

                {/* Image */}
                <img
                    src={imageUrl}
                    alt="Export preview"
                    draggable={false}
                    className="select-none"
                    style={imageStyle}
                />

                {/* Drag indicator overlay for Fill mode */}
                {fitMode === 'fill' && isDragging && (
                    <div className="absolute inset-0 bg-brand/10 pointer-events-none" />
                )}
            </div>

            {/* Mode description */}
            <p className={`text-xs text-center ${styles.textSub}`}>
                {fitMode === 'fit' && 'Image fully visible with background'}
                {fitMode === 'fill' && 'Image covers frame, edges cropped'}
                {fitMode === 'stretch' && 'Image stretched to fit'}
            </p>
        </motion.div>
    );
};
