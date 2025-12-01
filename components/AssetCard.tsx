import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Asset } from '../types';
import { useThemeStyles } from './NeuComponents';
import { Download, Trash2 } from 'lucide-react'; // Removed Maximize2
import { downloadImage } from '../utils/download';

interface AssetCardProps {
  asset: Asset;
  aspectRatio?: string;
  // primaryColor prop removed as it was unused
  onDelete?: (id: string) => void;
  onClick?: () => void;
}

const getPaddingBottom = (ratio: string = '1:1') => {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return '100%';
  return `${(h / w) * 100}%`;
};

const AssetCardComponent: React.FC<AssetCardProps> = ({
  asset,
  aspectRatio = '1:1',
  onDelete,
  onClick
}) => {
  const { styles, theme } = useThemeStyles();
  const isDark = theme === 'dark';
  const [isLoaded, setIsLoaded] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadImage(asset.content, `ad-asset-${asset.id}.png`);
  };

  // Physical "Pop" Shadow - NOW USING STANDARD THEME
  // const poppedShadow = ... (Removed)
  // const bgStyle = ... (Removed)
  // const borderColor = ... (Removed)

  const paddingBottom = getPaddingBottom(aspectRatio);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
      className={`
        relative group rounded-3xl mb-6 w-full 
        ${onClick ? 'cursor-pointer' : ''}
        ${styles.shadowOut} 
        ${styles.bg}
      `}
      style={{
        // Padding Hack for Consistent Sizing
        height: 0,
        paddingBottom: paddingBottom,

        // In Shape Mode: Solid Color (using morphColor logic if we had it here, or just bg).
        // For now, relying on classes for Content Mode. 
        // For Shape Mode, we need to ensure it has a background but no shadow.
        // SYNCED COLOR: Using #0F1115 (Theme BG) to match LiquidSelector for seamless morph.
        // backgroundColor: isShape ? (isDark ? '#0F1115' : '#E0E5EC') : undefined, // Removed
        // boxShadow: isShape ? 'none' : undefined // Removed
      }}
    >
      {/* Container - Absolute with m-4 to create the Bezel */}
      {/* In Shape Mode, we hide the content */}
      <div className={`absolute inset-0 m-6 overflow-hidden rounded-2xl`}>

        {/* Placeholder (Skeleton) until image loads */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        )}

        <motion.img
          src={asset.content}
          alt={asset.prompt}
          onLoad={() => setIsLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gloss Sheen (One-time entrance could be added here if we track 'isNew') */}
      </div>

      {/* Hover Overlay - Adjusted to fit new structure */}
      <div className={`absolute inset-0 m-6 pointer-events-none`}>
        <div className="absolute inset-0 bg-gradient-to-t from-neu-dark/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-30 rounded-2xl">
          <p className="text-white text-sm font-medium line-clamp-2 mb-3 drop-shadow-md">{asset.prompt}</p>
          <div className="flex justify-between items-center pointer-events-auto">
            <span className="text-[10px] text-gray-300 uppercase tracking-wider font-bold bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
              {asset.stylePreset || 'Custom'}
            </span>
            <div className="flex gap-2">
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}
                  className="p-2 bg-red-500/80 backdrop-blur-md rounded-lg text-white hover:bg-red-600 transition-colors hover:scale-105 active:scale-95"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={handleDownload}
                className="p-2 bg-brand backdrop-blur-md rounded-lg text-white hover:bg-brand-hover transition-colors hover:scale-105 active:scale-95 shadow-lg shadow-brand/30"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AssetCard = React.memo(AssetCardComponent);
