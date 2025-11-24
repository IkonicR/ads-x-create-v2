
import React from 'react';
import { Asset } from '../types';
import { NeuCard, NeuButton, useThemeStyles } from '../components/NeuComponents';
import MasonryGrid from '../components/MasonryGrid';
import { Download, Search, Filter, ExternalLink, Copy } from 'lucide-react';
import { GalaxyHeading } from '../components/GalaxyHeading';

interface LibraryProps {
  assets: Asset[];
}

const Library: React.FC<LibraryProps> = ({ assets }) => {
  const { styles } = useThemeStyles();

  return (
    <div className="space-y-8 pb-10">
      <header>
        <GalaxyHeading 
          text="Asset Library" 
          className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
        />
        <p className={styles.textSub}>All your generated creative history in one place.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assets.map(asset => (
          <NeuCard key={asset.id} className="flex flex-col group">
            <div className={`flex-1 mb-4 overflow-hidden rounded-xl ${styles.bg} ${styles.shadowIn} relative`}>
              {asset.type === 'text' ? (
                <div className="p-6 h-full flex items-center justify-center text-center">
                  <p className={`italic ${styles.textMain} text-sm`}>"{asset.content}"</p>
                </div>
              ) : (
                <img src={asset.content} alt="Asset" className="w-full h-48 object-cover" />
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <button className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform"><Download size={16}/></button>
                 <button className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform"><Copy size={16}/></button>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                 <span className={`text-xs font-bold px-2 py-1 rounded ${styles.bgAccent} ${asset.type === 'image' ? 'text-purple-500' : 'text-blue-500'}`}>
                   {asset.type.toUpperCase()}
                 </span>
                 <span className={`text-xs ${styles.textSub}`}>{new Date(asset.createdAt).toLocaleDateString()}</span>
              </div>
              <p className={`text-xs font-bold ${styles.textSub} truncate`}>{asset.prompt}</p>
              {asset.stylePreset && (
                <p className={`text-[10px] ${styles.textSub} mt-1`}>Style: {asset.stylePreset}</p>
              )}
            </div>
          </NeuCard>
        ))}
      </div>
      
      {assets.length === 0 && (
        <div className={`text-center py-20 ${styles.textSub}`}>
          <p>No assets yet. Go to the Creator to start building.</p>
        </div>
      )}
    </div>
  );
};

export default Library;
