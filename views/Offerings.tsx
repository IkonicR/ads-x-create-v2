
import React, { useState, useEffect } from 'react';
import { Business, Offering } from '../types';
import { NeuCard, NeuInput, NeuButton, NeuTextArea, NeuSelect, useThemeStyles, NeuBadge } from '../components/NeuComponents';
import { NeuImageUploader } from '../components/NeuImageUploader';
import { ShoppingBag, Plus, Trash2, DollarSign, Tag, Edit2, Save, X } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { GalaxyHeading } from '../components/GalaxyHeading';

interface OfferingsProps {
  business: Business;
  updateBusiness: (b: Business) => Promise<void>;
}

const Offerings: React.FC<OfferingsProps> = ({ business, updateBusiness }) => {
  const [localBusiness, setLocalBusiness] = useState<Business>(business);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isDirty, setDirty } = useNavigation();
  const { notify } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const { styles } = useThemeStyles();
  
  const [formState, setFormState] = useState<Partial<Offering>>({
    name: '', description: '', price: '', category: 'Product', imageUrl: '', preserveLikeness: false
  });

  useEffect(() => {
    setLocalBusiness(business);
  }, [business]);

  useEffect(() => {
    const isChanged = JSON.stringify(business) !== JSON.stringify(localBusiness);
    setDirty(isChanged);
  }, [business, localBusiness, setDirty]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBusiness(localBusiness);
      notify({ title: 'Offerings Saved', type: 'success' });
    } catch (e) {
       notify({ title: 'Save Failed', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormState({ name: '', description: '', price: '', category: 'Product', imageUrl: '', preserveLikeness: false });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEditClick = (offering: Offering) => {
    setFormState({ ...offering });
    setEditingId(offering.id);
    setIsFormOpen(true);
    // Scroll to top gently
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (!formState.name) return;

    if (editingId) {
      // Update existing
      setLocalBusiness(prev => ({
        ...prev,
        offerings: prev.offerings.map(o => o.id === editingId ? { ...o, ...formState } as Offering : o)
      }));
      notify({ title: 'Offering Updated', type: 'success' });
    } else {
      // Add new
      const newOffering: Offering = {
        id: Date.now().toString(),
        name: formState.name!,
        description: formState.description || '',
        price: formState.price || '',
        category: formState.category || 'Product',
        active: true,
        imageUrl: formState.imageUrl || '',
        preserveLikeness: formState.preserveLikeness || false
      };
      setLocalBusiness(prev => ({
        ...prev,
        offerings: [...prev.offerings, newOffering]
      }));
      notify({ title: 'Offering Added', type: 'success' });
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this offering?')) {
      setLocalBusiness(prev => ({
        ...prev,
        offerings: prev.offerings.filter(o => o.id !== id)
      }));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-center sticky top-0 z-10 py-4 bg-opacity-90 backdrop-blur-sm">
        <div>
          <GalaxyHeading 
            text="Offerings" 
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
          />
          <p className={styles.textSub}>Manage the products and services you want to promote.</p>
        </div>
        <div className="flex gap-3">
          <NeuButton 
            variant={isDirty ? 'primary' : 'secondary'} 
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-2"
          >
             <Save size={18} />
             {isSaving ? 'Saving...' : 'Save Changes'}
          </NeuButton>
          {!isFormOpen && (
            <NeuButton variant="primary" onClick={() => setIsFormOpen(true)}>
              <Plus size={18} /> Add Offering
            </NeuButton>
          )}
        </div>
      </header>

      {isFormOpen && (
        <NeuCard className="animate-fade-in border-2 border-[#6D5DFC]/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${styles.textMain}`}>
              {editingId ? 'Edit Offering' : 'New Offering'}
            </h3>
            <button onClick={resetForm} className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <X size={20} className={styles.textSub} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
             <div className="md:col-span-4">
                <NeuImageUploader 
                  currentValue={formState.imageUrl || ''} 
                  onUpload={(url) => setFormState(prev => ({ ...prev, imageUrl: url }))} 
                  folder="products"
                />
                <p className={`text-xs text-center mt-2 ${styles.textSub}`}>
                   Product Image (Optional)
                </p>
             </div>
             <div className="md:col-span-8 grid grid-cols-1 gap-4">
               <NeuInput 
                 placeholder="Name (e.g. Summer Latte)" 
                 value={formState.name} 
                 onChange={e => setFormState(prev => ({...prev, name: e.target.value}))} 
               />
               <div className="grid grid-cols-2 gap-4">
                 <NeuInput 
                   placeholder="Price (e.g. $5.00)" 
                   value={formState.price} 
                   onChange={e => setFormState(prev => ({...prev, price: e.target.value}))} 
                 />
                 <NeuInput 
                   placeholder="Category (e.g. Coffee)" 
                   value={formState.category} 
                   onChange={e => setFormState(prev => ({...prev, category: e.target.value}))} 
                 />
               </div>
               <NeuTextArea 
                 placeholder="Description - Describe the flavors, benefits, or details." 
                 value={formState.description} 
                 onChange={e => setFormState(prev => ({...prev, description: e.target.value}))} 
                 className="min-h-[80px]"
               />
               
               <div className={`p-4 rounded-xl border ${styles.border} bg-black/5 flex items-start gap-3`}>
                  <input 
                    type="checkbox" 
                    id="preserve"
                    checked={formState.preserveLikeness || false}
                    onChange={e => setFormState(prev => ({...prev, preserveLikeness: e.target.checked}))}
                    className="mt-1 w-4 h-4 accent-[#6D5DFC]"
                  />
                  <div>
                    <label htmlFor="preserve" className={`text-sm font-bold ${styles.textMain} cursor-pointer block`}>
                      Preserve Visual Identity (Strict Mode)
                    </label>
                    <p className={`text-xs ${styles.textSub} mt-1`}>
                      Enable this if the AI must NOT alter the product's appearance (e.g. for Pharma, Real Estate, or strict Brand Compliance). The AI will composite the exact image you uploaded instead of generating a new version.
                    </p>
                  </div>
               </div>
             </div>
          </div>
          <div className="flex gap-4 justify-end border-t pt-4 border-gray-200/10">
            <NeuButton onClick={resetForm}>Cancel</NeuButton>
            <NeuButton variant="primary" onClick={handleSubmit}>
              {editingId ? 'Update Offering' : 'Add to List'}
            </NeuButton>
          </div>
        </NeuCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {localBusiness.offerings.map(offering => (
          <NeuCard key={offering.id} className="flex flex-col justify-between group relative overflow-hidden">
             <div className="flex gap-4">
               <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200/20">
                 {offering.imageUrl ? (
                   <img src={offering.imageUrl} alt={offering.name} className="w-full h-full object-cover" />
                 ) : (
                   <ShoppingBag size={32} className="text-gray-300" />
                 )}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start mb-1">
                   <h4 className={`font-bold ${styles.textMain} text-lg truncate pr-2`}>{offering.name}</h4>
                   <NeuBadge>{offering.price}</NeuBadge>
                 </div>
                 <p className={`${styles.textSub} text-sm mb-3 line-clamp-2`}>{offering.description}</p>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Tag size={12} className={styles.textSub} />
                      <span className={`text-xs font-bold ${styles.textSub} uppercase`}>{offering.category}</span>
                    </div>
                    {offering.preserveLikeness && (
                      <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold border border-purple-200">
                        Strict ID
                      </span>
                    )}
                 </div>
               </div>
             </div>
             
             {/* Actions */}
             <div className={`mt-4 pt-4 border-t ${styles.border} flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
               <button 
                 onClick={() => handleEditClick(offering)}
                 className={`text-blue-400 hover:text-blue-600 text-xs font-bold flex items-center gap-1 transition-colors`}
               >
                 <Edit2 size={14} /> Edit
               </button>
               <button 
                 onClick={() => handleDelete(offering.id)}
                 className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
               >
                 <Trash2 size={14} /> Remove
               </button>
             </div>
          </NeuCard>
        ))}
        
        {localBusiness.offerings.length === 0 && !isFormOpen && (
           <div className={`col-span-2 text-center py-16 ${styles.textSub} border-2 border-dashed border-gray-300/20 rounded-3xl`}>
             <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
             <p className="text-lg font-medium">No offerings found.</p>
             <p className="text-sm opacity-70 mb-6">Add your products or services to start generating ads.</p>
             <NeuButton onClick={() => setIsFormOpen(true)}>Create First Offering</NeuButton>
           </div>
        )}
      </div>
    </div>
  );
};

export default Offerings;
