import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Asset } from '../types';
import { useThemeStyles } from './NeuComponents';
import { Download, Trash2 } from 'lucide-react';
import { downloadImage, getAssetFilename } from '../utils/download';

interface AssetCardProps {
  asset: Asset;
  aspectRatio?: string;
  businessName?: string;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}

const AssetCardComponent: React.FC<AssetCardProps> = ({
  asset,
  aspectRatio = '1:1',
  businessName,
  onDelete,
  onClick
}) => {
  const { styles, theme } = useThemeStyles();
  const isDark = theme === 'dark';
  const [isLoaded, setIsLoaded] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const filename = getAssetFilename(asset, businessName);
    downloadImage(asset.content, filename);
  };

  // Parse aspect ratio for CSS
  const [w, h] = aspectRatio.split(':').map(Number);
  const aspectValue = w && h ? `${w}/${h}` : '1/1';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
      className={`
        relative group rounded-3xl p-6 w-full 
        ${onClick ? 'cursor-pointer' : ''}
        ${styles.shadowOut} 
        ${styles.bg}
      `}
    >
      {/* Inner image container with CSS aspect-ratio */}
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio: aspectValue }}
      >
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

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neu-dark/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-30">
          <p className="text-white text-sm font-medium line-clamp-2 mb-3 drop-shadow-md">{asset.prompt}</p>
          <div className="flex justify-between items-center">
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

