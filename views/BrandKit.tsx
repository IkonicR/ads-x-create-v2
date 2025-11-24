
import React, { useState, useEffect } from 'react';
import { Business, TeamMember, Testimonial } from '../types';
import { NeuCard, NeuInput, NeuButton, NeuTextArea, useThemeStyles } from '../components/NeuComponents';
import { Palette, Mic2, Ban, Users, Plus, Trash2, Image as ImageIcon, Sliders, Star, Type, Zap, Save, UploadCloud, Loader } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { StorageService } from '../services/storage';

interface BrandKitProps {
  business: Business;
  updateBusiness: (b: Business) => Promise<void>;
}

const BrandKit: React.FC<BrandKitProps> = ({ business, updateBusiness }) => {
  const [localBusiness, setLocalBusiness] = useState<Business>(business);
  const { isDirty, setDirty } = useNavigation();
  const { notify } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Local input states for "Add New" fields
  const [newMemberName, setNewMemberName] = useState('');
  const [newInspImage, setNewInspImage] = useState('');
  const [newUSP, setNewUSP] = useState('');
  const [newTestimonial, setNewTestimonial] = useState<{author: string, quote: string}>({ author: '', quote: '' });
  
  const { styles, theme } = useThemeStyles();

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
      notify({ title: 'Brand Kit Saved', type: 'success', message: 'Your brand identity has been updated.' });
    } catch (e) {
      notify({ title: 'Save Failed', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    
    // Validate
    if (file.size > 5 * 1024 * 1024) {
       notify({ title: 'File too large', type: 'error', message: 'Logo must be under 5MB' });
       return;
    }
    if (!file.type.startsWith('image/')) {
       notify({ title: 'Invalid file', type: 'error', message: 'Please upload an image (PNG, JPG, SVG)' });
       return;
    }

    setIsLogoUploading(true);
    try {
       const url = await StorageService.uploadBusinessAsset(file, localBusiness.id, 'logo');
       if (url) {
         updateLocal({ logoUrl: url });
         notify({ title: 'Logo Uploaded', type: 'success' });
       } else {
         notify({ title: 'Upload Failed', type: 'error' });
       }
    } catch (err) {
       console.error(err);
       notify({ title: 'Upload Failed', type: 'error' });
    } finally {
       setIsLogoUploading(false);
       setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const updateLocal = (updates: Partial<Business>) => {
    setLocalBusiness(prev => ({ ...prev, ...updates }));
  };


  const updateColor = (key: keyof typeof localBusiness.colors, val: string) => {
    setLocalBusiness(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: val }
    }));
  };

  const updateSlider = (key: keyof typeof localBusiness.voice.sliders, val: string) => {
    setLocalBusiness(prev => ({
      ...prev,
      voice: {
        ...prev.voice,
        sliders: { ...prev.voice.sliders, [key]: parseInt(val) }
      }
    }));
  };

  const addTeamMember = () => {
    if (!newMemberName) return;
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newMemberName,
      role: 'Team Member',
      imageUrl: `https://ui-avatars.com/api/?name=${newMemberName}&background=random`
    };
    updateLocal({
      teamMembers: [...(localBusiness.teamMembers || []), newMember]
    });
    setNewMemberName('');
  };

  const addInspirationImage = () => {
    if (!newInspImage) return;
    updateLocal({
      inspirationImages: [...(localBusiness.inspirationImages || []), newInspImage]
    });
    setNewInspImage('');
  };

  const addUSP = () => {
    if (!newUSP) return;
    updateLocal({
      usps: [...(localBusiness.usps || []), newUSP]
    });
    setNewUSP('');
  };

  const addTestimonial = () => {
    if (!newTestimonial.quote) return;
    const t: Testimonial = {
      id: Date.now().toString(),
      author: newTestimonial.author || 'Anonymous',
      quote: newTestimonial.quote
    };
    updateLocal({
      testimonials: [...(localBusiness.testimonials || []), t]
    });
    setNewTestimonial({ author: '', quote: '' });
  };

  const handleDeleteTestimonial = (id: string) => {
     updateLocal({
       testimonials: localBusiness.testimonials.filter(x => x.id !== id)
     });
  };

  const handleDeleteInspiration = (idx: number) => {
     updateLocal({
       inspirationImages: localBusiness.inspirationImages.filter((_, i) => i !== idx)
     });
  };

   const handleDeleteTeamMember = (id: string) => {
      updateLocal({
         teamMembers: localBusiness.teamMembers.filter(m => m.id !== id)
      });
   };

   const handleDeleteUSP = (idx: number) => {
      updateLocal({
         usps: (localBusiness.usps || []).filter((_, i) => i !== idx)
      });
   };

   const handleDeleteKeyword = (idx: number) => {
      updateLocal({ 
         voice: { ...localBusiness.voice, keywords: localBusiness.voice.keywords.filter((_, i) => i !== idx) }
      });
   };
   
   const handleAddKeyword = (val: string) => {
       updateLocal({ voice: { ...localBusiness.voice, keywords: [...localBusiness.voice.keywords, val] }});
   };

   const handleDeleteNegativeKeyword = (idx: number) => {
      updateLocal({ 
         voice: { ...localBusiness.voice, negativeKeywords: (localBusiness.voice.negativeKeywords || []).filter((_, i) => i !== idx) }
      });
   };

   const handleAddNegativeKeyword = (val: string) => {
      updateLocal({ voice: { ...localBusiness.voice, negativeKeywords: [...(localBusiness.voice.negativeKeywords || []), val] }});
   };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-center sticky top-0 z-10 py-4 bg-opacity-90 backdrop-blur-sm">
        <div>
          <GalaxyHeading 
            text="Brand Kit" 
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
          />
          <p className={styles.textSub}>Define how {localBusiness.name} looks, sounds, and behaves.</p>
        </div>
        <NeuButton 
          variant={isDirty ? 'primary' : 'secondary'} 
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </NeuButton>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visual Identity */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-[#6D5DFC]`}>
              <Palette size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Visual Identity</h3>
          </div>

          <div className="space-y-6">
            {['primary', 'secondary', 'accent'].map((key) => (
              <div key={key}>
                <label className={`text-sm font-bold ${styles.textSub} mb-2 block capitalize`}>{key} Color</label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2)] border-2 border-white/20"
                    style={{ backgroundColor: localBusiness.colors[key as keyof typeof localBusiness.colors] }}
                  ></div>
                  <NeuInput 
                    value={localBusiness.colors[key as keyof typeof localBusiness.colors]} 
                    onChange={(e) => updateColor(key as any, e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </NeuCard>

         {/* Brand Assets */}
         <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-pink-500`}>
              <Type size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Assets & Typography</h3>
          </div>

          <div className="space-y-6">
             <div>
                <label className={`text-sm font-bold ${styles.textSub} mb-2 block`}>Brand Logo</label>
                <div 
                   className={`relative w-full h-32 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden
                     ${isDragging ? 'border-[#6D5DFC] bg-[#6D5DFC]/10' : `${styles.border} ${styles.bgAccent}`}
                   `}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   onClick={() => document.getElementById('logo-upload')?.click()}
                >
                   {isLogoUploading ? (
                     <div className="flex flex-col items-center text-[#6D5DFC]">
                        <Loader className="animate-spin mb-2" size={24} />
                        <span className="text-xs font-bold">Uploading...</span>
                     </div>
                   ) : localBusiness.logoUrl ? (
                     <div className="relative w-full h-full group">
                        <img src={localBusiness.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-white text-xs font-bold flex items-center gap-2">
                             <UploadCloud size={16} /> Replace Logo
                           </span>
                        </div>
                     </div>
                   ) : (
                     <div className={`flex flex-col items-center ${styles.textSub} transition-colors group-hover:text-[#6D5DFC]`}>
                        <UploadCloud size={32} className="mb-2 opacity-50" />
                        <p className="text-xs font-bold">Drag & drop or click to upload</p>
                        <p className="text-[10px] opacity-60 mt-1">PNG, JPG, SVG (Max 5MB)</p>
                     </div>
                   )}
                   <input 
                     id="logo-upload" 
                     type="file" 
                     className="hidden" 
                     accept="image/*"
                     onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])}
                   />
                </div>
             </div>
             <div>
                <label className={`text-sm font-bold ${styles.textSub} mb-2 block`}>Primary Font Name</label>
                <NeuInput 
                  value={localBusiness.fontName || ''}
                  placeholder="e.g. Helvetica Neue"
                  onChange={(e) => updateLocal({ fontName: e.target.value })}
                />
             </div>
          </div>
        </NeuCard>

        {/* Voice & Personality Sliders */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-[#6D5DFC]`}>
              <Sliders size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Voice Personality</h3>
          </div>

          <div className="space-y-8 px-2">
            {/* Slider 1 */}
            <div>
              <div className={`flex justify-between text-xs font-bold ${styles.textSub} mb-2`}>
                 <span>Reserved</span>
                 <span>Assertive</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={localBusiness.voice.sliders?.identity || 50}
                onChange={(e) => updateSlider('identity', e.target.value)}
                className={`w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer ${styles.shadowIn}`}
              />
            </div>

             {/* Slider 2 */}
             <div>
              <div className={`flex justify-between text-xs font-bold ${styles.textSub} mb-2`}>
                 <span>Formal</span>
                 <span>Casual</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={localBusiness.voice.sliders?.style || 50}
                onChange={(e) => updateSlider('style', e.target.value)}
                className={`w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer ${styles.shadowIn}`}
              />
            </div>

             {/* Slider 3 */}
             <div>
              <div className={`flex justify-between text-xs font-bold ${styles.textSub} mb-2`}>
                 <span>Serious</span>
                 <span>Humorous</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={localBusiness.voice.sliders?.emotion || 50}
                onChange={(e) => updateSlider('emotion', e.target.value)}
                className={`w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer ${styles.shadowIn}`}
              />
            </div>
          </div>
        </NeuCard>

        {/* Vocabulary */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-[#6D5DFC]`}>
              <Mic2 size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Vocabulary</h3>
          </div>

          <div className="space-y-6">
             <div>
                <label className={`text-sm font-bold ${styles.textSub} mb-2 block`}>Slogan</label>
                <NeuInput 
                  value={localBusiness.voice.slogan}
                  placeholder="e.g. Just Do It"
                  onChange={(e) => updateLocal({ voice: { ...localBusiness.voice, slogan: e.target.value }})}
                />
             </div>

             <div>
                <label className={`text-sm font-bold ${styles.textSub} mb-2 block`}>Power Words</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {localBusiness.voice.keywords.map((k, i) => (
                    <span key={i} className={`px-3 py-1 rounded-lg ${styles.bg} ${styles.shadowIn} text-xs font-bold ${styles.textMain} flex items-center gap-2`}>
                      {k}
                      <button onClick={() => {
                         const newK = [...localBusiness.voice.keywords];
                         newK.splice(i, 1);
                         updateLocal({ voice: { ...localBusiness.voice, keywords: newK }});
                      }} className="text-red-400 hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
                <NeuInput 
                  placeholder="Add word and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        updateLocal({ voice: { ...localBusiness.voice, keywords: [...localBusiness.voice.keywords, val] }});
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
             </div>
          </div>
        </NeuCard>

         {/* USPs / Differentiators */}
         <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-yellow-500`}>
              <Zap size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Differentiators (USPs)</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-4`}>What makes you different? (e.g., Free Shipping, Family Owned)</p>

          <div className="flex flex-wrap gap-2 mb-3">
             {(localBusiness.usps || []).map((k, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-yellow-100 border border-yellow-200 text-xs font-bold text-yellow-700 flex items-center gap-2">
                  {k}
                  <button onClick={() => {
                     const newK = [...(localBusiness.usps || [])];
                     newK.splice(i, 1);
                     updateLocal({ usps: newK });
                  }} className="text-yellow-500 hover:text-yellow-900">×</button>
                </span>
             ))}
          </div>
          <NeuInput 
            placeholder="Add differentiator and press Enter"
            value={newUSP}
            onChange={(e) => setNewUSP(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addUSP();
              }
            }}
          />
        </NeuCard>

        {/* The Ban List */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-red-500`}>
              <Ban size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>The Ban List</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-4`}>Words the AI is <strong className="text-red-500">strictly forbidden</strong> from using.</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
              {(localBusiness.voice.negativeKeywords || []).map((k, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-red-100 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2">
                  {k}
                  <button onClick={() => {
                      const newK = [...(localBusiness.voice.negativeKeywords || [])];
                      newK.splice(i, 1);
                      updateLocal({ voice: { ...localBusiness.voice, negativeKeywords: newK }});
                  }} className="text-red-400 hover:text-red-800">×</button>
                </span>
              ))}
          </div>
          <NeuInput 
              placeholder="e.g. Cheap, Moist, Urgent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                    updateLocal({ voice: { ...localBusiness.voice, negativeKeywords: [...(localBusiness.voice.negativeKeywords || []), val] }});
                    e.currentTarget.value = '';
                  }
                }
              }}
          />
        </NeuCard>

        {/* Testimonials / Wall of Love */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-orange-500`}>
              <Star size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Wall of Love</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-4`}>Customer quotes to use in ad copy.</p>

          <div className="space-y-3 mb-4">
             {(localBusiness.testimonials || []).map((t) => (
               <div key={t.id} className={`p-3 rounded-xl ${styles.bgAccent} border ${styles.border} relative group`}>
                  <p className={`text-xs italic ${styles.textMain}`}>"{t.quote}"</p>
                  <p className={`text-[10px] font-bold ${styles.textSub} mt-1 text-right`}>- {t.author}</p>
                  <button 
                    onClick={() => {
                       updateLocal({
                         testimonials: localBusiness.testimonials.filter(x => x.id !== t.id)
                       });
                    }}
                    className="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
             ))}
          </div>
          
          <div className="space-y-2">
            <NeuTextArea 
               placeholder="Paste customer quote here..."
               value={newTestimonial.quote}
               onChange={(e) => setNewTestimonial({...newTestimonial, quote: e.target.value})}
               className="min-h-[60px]"
            />
            <div className="flex gap-2">
               <NeuInput 
                  placeholder="Customer Name"
                  value={newTestimonial.author}
                  onChange={(e) => setNewTestimonial({...newTestimonial, author: e.target.value})}
               />
               <NeuButton onClick={addTestimonial}>Add</NeuButton>
            </div>
          </div>
        </NeuCard>

        {/* Inspiration Board */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-purple-500`}>
              <ImageIcon size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Inspiration Board</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-4`}>Ads or images you admire. The AI will use these as style references.</p>

          <div className="grid grid-cols-3 gap-3 mb-4">
             {(localBusiness.inspirationImages || []).map((img, idx) => (
               <div key={idx} className="relative group aspect-square">
                  <img src={img} alt="Inspiration" className="w-full h-full object-cover rounded-xl shadow-sm" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                     <button 
                        onClick={() => {
                           updateLocal({
                             inspirationImages: localBusiness.inspirationImages.filter((_, i) => i !== idx)
                           })
                        }}
                        className="text-white p-1"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
               </div>
             ))}
          </div>

          <div className="flex gap-2">
            <NeuInput 
              placeholder="Paste Image URL..."
              value={newInspImage}
              onChange={(e) => setNewInspImage(e.target.value)}
            />
            <NeuButton onClick={addInspirationImage} disabled={!newInspImage}>Add</NeuButton>
          </div>
        </NeuCard>

        {/* Team & Faces */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-blue-500`}>
              <Users size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Team & Faces</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-4`}>Upload photos of you or your staff to feature in ads.</p>

          <div className="grid grid-cols-3 gap-3 mb-4">
             {(localBusiness.teamMembers || []).map((member) => (
               <div key={member.id} className="relative group">
                  <img src={member.imageUrl} alt={member.name} className="w-full h-24 object-cover rounded-xl shadow-sm" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                     <button 
                        onClick={() => {
                           updateLocal({
                             teamMembers: localBusiness.teamMembers.filter(m => m.id !== member.id)
                           })
                        }}
                        className="text-white p-1"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
                  <p className={`text-[10px] text-center font-bold mt-1 ${styles.textSub} truncate`}>{member.name}</p>
               </div>
             ))}
             
             {/* Placeholder Add Button */}
             <button className={`h-24 rounded-xl border-2 border-dashed ${styles.border} flex flex-col items-center justify-center ${styles.textSub} hover:border-[#6D5DFC] hover:text-[#6D5DFC] transition-colors`}
                onClick={() => document.getElementById('team-input')?.focus()}
             >
                <Plus size={24} />
                <span className="text-[10px] font-bold uppercase mt-1">Add Photo</span>
             </button>
          </div>

          <div className="flex gap-2">
            <NeuInput 
              id="team-input"
              placeholder="Employee Name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
            <NeuButton onClick={addTeamMember} disabled={!newMemberName}>Add</NeuButton>
          </div>
        </NeuCard>
      </div>
    </div>
  );
};

export default BrandKit;
