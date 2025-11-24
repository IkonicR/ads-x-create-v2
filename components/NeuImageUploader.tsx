
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, File } from 'lucide-react';
import { useThemeStyles } from './NeuComponents';
import { StorageService } from '../services/storage';

interface NeuImageUploaderProps {
  currentValue: string;
  onUpload: (url: string) => void;
  folder?: string;
  className?: string;
}

export const NeuImageUploader: React.FC<NeuImageUploaderProps> = ({ 
  currentValue, 
  onUpload, 
  folder = 'misc',
  className 
}) => {
  const { styles } = useThemeStyles();
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setLoading(true);
    try {
      // We use a generic "admin" ID or "public" scope for these assets
      // Assuming StorageService can handle 'public' as businessId for shared assets 
      // OR we just use a hardcoded ID for system assets if needed.
      // For now, using 'system_assets' as the businessId scope for organization.
      const url = await StorageService.uploadBusinessAsset(file, 'system_assets', folder);
      if (url) {
        onUpload(url);
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('Upload error.');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    onUpload('');
  };

  return (
    <div className={className}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        className="hidden" 
      />
      
      {currentValue ? (
        <div className={`relative group rounded-2xl overflow-hidden aspect-video ${styles.shadowIn}`}>
          <img 
            src={currentValue} 
            alt="Preview" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md text-white transition-all"
               title="Change Image"
             >
               <Upload size={20} />
             </button>
             <button 
               onClick={clearImage}
               className="p-2 bg-red-500/50 hover:bg-red-500/80 rounded-full backdrop-blur-md text-white transition-all"
               title="Remove Image"
             >
               <X size={20} />
             </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer
            flex flex-col items-center justify-center py-8 gap-3
            ${isDragging 
              ? 'border-brand bg-brand/5 scale-[0.99]' 
              : `${styles.bg} ${styles.shadowIn} border-transparent hover:border-brand/30`
            }
          `}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          ) : (
            <>
              <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-gray-400`}>
                <ImageIcon size={24} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold ${styles.textMain}`}>
                  Click or Drag to Upload
                </p>
                <p className={`text-xs ${styles.textSub} mt-1`}>
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
