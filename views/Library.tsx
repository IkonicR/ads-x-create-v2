
import React from 'react';
import { Asset } from '../types';
import { StorageService } from '../services/storage';
import { NeuCard, NeuButton, useThemeStyles } from '../components/NeuComponents';
import MasonryGrid from '../components/MasonryGrid';
import { Download, Search, Filter, ExternalLink, Copy } from 'lucide-react';
import { GalaxyHeading } from '../components/GalaxyHeading';

interface LibraryProps {
  businessId: string;
}

const Library: React.FC<LibraryProps> = ({ businessId }) => {
  const { styles } = useThemeStyles();
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const LIMIT = 12;

  const loadAssets = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const currentOffset = reset ? 0 : offset;
      const newAssets = await StorageService.getAssets(businessId, LIMIT, currentOffset);

      if (newAssets.length < LIMIT) {
        setHasMore(false);
      }

      setAssets(prev => reset ? newAssets : [...prev, ...newAssets]);
      setOffset(prev => reset ? LIMIT : prev + LIMIT);
    } catch (error) {
      console.error("Failed to load assets", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  React.useEffect(() => {
    loadAssets(true);
  }, [businessId]);

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
                <button className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform"><Download size={16} /></button>
                <button className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform"><Copy size={16} /></button>
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

      {assets.length === 0 && !loading && (
        <div className={`text-center py-20 ${styles.textSub}`}>
          <p>No assets yet. Go to the Creator to start building.</p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <NeuButton
            onClick={() => loadAssets(false)}
            disabled={loading}
            className="min-w-[200px]"
          >
            {loading ? 'Loading...' : 'Load More'}
          </NeuButton>
        </div>
      )}
    </div>
  );
};

export default Library;
