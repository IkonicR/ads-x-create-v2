import React, { useState } from 'react';
import { AdminNote, LinkedEntity } from '../../types';
import { NeuCard, NeuButton, NeuTextArea, NeuDropdown, NeuListBuilder } from '../../components/NeuComponents';
import { Plus, Square, RotateCcw, CheckSquare, X, Link, ChevronLeft, ChevronRight, Building2, LayoutTemplate, Palette, Filter, Trash2, Bug, Map, Lightbulb } from 'lucide-react';

interface RoadmapTabProps {
    notes: AdminNote[];
    styles: any;
    newNote: string;
    setNewNote: (val: string) => void;
    category: AdminNote['category'];
    setCategory: (val: AdminNote['category']) => void;
    newNotePriority: AdminNote['priority'];
    setNewNotePriority: (val: AdminNote['priority']) => void;
    newNoteLinks: LinkedEntity[];
    handleAddNote: () => void;
    removeLink: (noteId: string | 'new', linkId: string) => void;
    openLinkPicker: (target: 'new' | 'edit') => void;
    handleUpdateNote: (id: string, updates: Partial<AdminNote>) => void;
    deleteNote: (id: string) => void;
    moveNote: (id: string, newStatus: AdminNote['status']) => void;
    editingNoteId: string | null;
    setEditingNoteId: (id: string | null) => void;
    filterCategory: 'All' | AdminNote['category'];
    setFilterCategory: (val: 'All' | AdminNote['category']) => void;
    filterPriority: 'All' | AdminNote['priority'];
    setFilterPriority: (val: 'All' | AdminNote['priority']) => void;
    filterTag: string;
    setFilterTag: (val: string) => void;
    newNoteTags: string[];
    setNewNoteTags: (val: string[]) => void;
}

export const RoadmapTab: React.FC<RoadmapTabProps> = ({
    notes,
    styles,
    newNote,
    setNewNote,
    category,
    setCategory,
    newNotePriority,
    setNewNotePriority,
    newNoteLinks,
    handleAddNote,
    removeLink,
    openLinkPicker,
    handleUpdateNote,
    deleteNote,
    moveNote,
    editingNoteId,
    setEditingNoteId,
    filterCategory,
    setFilterCategory,
    filterPriority,
    setFilterPriority,
    filterTag,
    setFilterTag,
    newNoteTags,
    setNewNoteTags
}) => {
    // ... (icon logic) ...
    const renderIcon = (cat: string) => {
        if (cat === 'Bug') return <Bug size={16} className="text-red-400" />;
        if (cat === 'Roadmap') return <Map size={16} className="text-blue-400" />;
        return <Lightbulb size={16} className="text-yellow-400" />;
    };

    // Calculate unique tags
    const allTags = Array.from(new Set(notes.flatMap(n => n.tags || []))).sort();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* ... (Quick Capture) ... */}
            <div className="lg:col-span-1">
                <NeuCard className="sticky top-4">
                    <h3 className={`text-lg font-bold ${styles.textMain} mb-4`}>Quick Capture</h3>
                    <div className="space-y-4">
                        <NeuTextArea
                            placeholder="What's the next big feature?"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="h-32"
                        />
                        <div className="flex gap-2">
                            {['Idea', 'Roadmap', 'Bug'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat as any)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${category === cat
                                        ? `${styles.bg} ${styles.shadowIn} text-brand`
                                        : `${styles.bg} ${styles.shadowOut} ${styles.textSub}`
                                        } `}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className={`text-[10px] font-bold uppercase ${styles.textSub} mb-2 block`}>Priority</label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'low', color: 'bg-blue-400' },
                                    { id: 'medium', color: 'bg-yellow-400' },
                                    { id: 'high', color: 'bg-red-400' }
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setNewNotePriority(p.id as any)}
                                        className={`flex-1 h-2 rounded-full transition-all ${newNotePriority === p.id
                                            ? `${p.color} scale-100 opacity-100 ring-2 ring-offset-2 ring-offset-transparent ring-${p.color}`
                                            : `${p.color} scale-90 opacity-30 hover:opacity-70`
                                            } `}
                                        title={p.id.toUpperCase()}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200/10">
                            <NeuListBuilder
                                items={newNoteTags}
                                onItemsChange={setNewNoteTags}
                                placeholder="Add tag..."
                                title="Tags"
                            />
                        </div>

                        {/* Attached Links (New Note) */}
                        {newNoteLinks.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {newNoteLinks.map(link => (
                                    <div key={link.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${styles.bg} ${styles.shadowIn} `}>
                                        <span className="opacity-50 uppercase">{link.type}</span>
                                        <span className={styles.textMain}>{link.name}</span>
                                        <button onClick={() => removeLink('new', link.id)} className="hover:text-red-400"><X size={10} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <NeuButton type="button" onClick={() => openLinkPicker('new')} className={`flex-1 ${styles.textSub} `}>
                                <Link size={16} /> Attach
                            </NeuButton>
                            <NeuButton type="button" variant="primary" className="flex-[2]" onClick={handleAddNote}>
                                <Plus size={18} /> Add to Hub
                            </NeuButton>
                        </div>
                    </div>
                </NeuCard>
            </div>

            <div className="lg:col-span-2">
                {/* Filter Bar */}
                <div className="flex gap-4 mb-4 p-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className={styles.textSub} />
                        <span className={`text-xs font-bold ${styles.textSub} `}>Filter:</span>
                    </div>

                    <NeuDropdown
                        options={[
                            { label: 'All Categories', value: 'All' },
                            { label: 'Idea', value: 'Idea' },
                            { label: 'Roadmap', value: 'Roadmap' },
                            { label: 'Bug', value: 'Bug' }
                        ]}
                        value={filterCategory}
                        onChange={(val) => setFilterCategory(val as any)}
                        className="w-40"
                    />

                    <NeuDropdown
                        options={[
                            { label: 'All Priorities', value: 'All' },
                            { label: 'High Priority', value: 'high' },
                            { label: 'Medium Priority', value: 'medium' },
                            { label: 'Low Priority', value: 'low' }
                        ]}
                        value={filterPriority}
                        onChange={(val) => setFilterPriority(val as any)}
                        className="w-40"
                    />

                    <NeuDropdown
                        options={[
                            { label: 'All Tags', value: 'All' },
                            ...allTags.map(tag => ({ label: `#${tag}`, value: tag }))
                        ]}
                        value={filterTag}
                        onChange={(val) => setFilterTag(val)}
                        className="w-40"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Columns */}
                    {[
                        { id: 'todo', title: 'Planned', icon: Square },
                        { id: 'in_progress', title: 'In Progress', icon: RotateCcw },
                        { id: 'done', title: 'Live', icon: CheckSquare }
                    ].map(col => (
                        <div key={col.id} className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-200/10 pb-2">
                                <div className="flex items-center gap-2">
                                    <col.icon size={16} className={styles.textSub} />
                                    <h3 className={`text-sm font-bold uppercase ${styles.textSub} `}>{col.title}</h3>
                                </div>
                                <span className={`text-[10px] font-mono ${styles.bg} ${styles.shadowIn} px-2 py-0.5 rounded-full`}>
                                    {notes.filter(n => n.status === col.id).length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {notes.filter(n => n.status === col.id).length === 0 && (
                                    <div className={`p-4 border-2 border-dashed border-gray-200/5 rounded-xl text-center ${styles.textSub} text-xs opacity-50`}>
                                        Empty
                                    </div>
                                )}
                                {notes
                                    .filter(n => n.status === col.id)
                                    .filter(n => filterCategory === 'All' || n.category === filterCategory)
                                    .filter(n => filterPriority === 'All' || n.priority === filterPriority)
                                    .filter(n => filterTag === 'All' || (n.tags && n.tags.includes(filterTag)))
                                    .map(note => (
                                        <NeuCard key={note.id} className={`relative group transition-all ${editingNoteId === note.id ? 'ring-2 ring-brand' : 'hover:scale-[1.02]'} `}>

                                            {editingNoteId === note.id ? (
                                                // --- EDIT MODE ---
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        {/* Priority Edit */}
                                                        <div className="flex gap-1">
                                                            {['low', 'medium', 'high'].map((p: any) => (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => handleUpdateNote(note.id, { priority: p })}
                                                                    className={`w-3 h-3 rounded-full transition-all ${note.priority === p
                                                                        ? (p === 'high' ? 'bg-red-400' : p === 'medium' ? 'bg-yellow-400' : 'bg-blue-400') + ' ring-2 ring-offset-1 ring-offset-transparent ring-gray-400'
                                                                        : 'bg-gray-600/30 hover:bg-gray-600/50'
                                                                        } `}
                                                                    title={`Set Priority: ${p} `}
                                                                />
                                                            ))}
                                                        </div>
                                                        <button onClick={() => setEditingNoteId(null)} className="text-gray-400 hover:text-white"><X size={14} /></button>
                                                    </div>

                                                    {/* Content Edit */}
                                                    <NeuTextArea
                                                        value={note.content}
                                                        onChange={(e) => handleUpdateNote(note.id, { content: e.target.value })}
                                                        className="text-sm min-h-[80px]"
                                                        autoFocus
                                                    />

                                                    <div className="flex justify-between items-center">
                                                        {/* Category Edit */}
                                                        <div className="flex gap-1">
                                                            {['Idea', 'Roadmap', 'Bug'].map((cat: any) => (
                                                                <button
                                                                    key={cat}
                                                                    onClick={() => handleUpdateNote(note.id, { category: cat })}
                                                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${note.category === cat
                                                                        ? `${styles.bg} ${styles.shadowIn} text-brand`
                                                                        : 'opacity-50 hover:opacity-100'
                                                                        } `}
                                                                >
                                                                    {cat}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <NeuButton type="button" onClick={() => setEditingNoteId(null)} className="px-2 py-1 h-auto text-xs bg-brand text-white border-none">Save</NeuButton>
                                                    </div>

                                                    {/* Tags Edit */}
                                                    <div className="pt-2 border-t border-gray-200/10">
                                                        <NeuListBuilder
                                                            items={note.tags || []}
                                                            onItemsChange={(tags) => handleUpdateNote(note.id, { tags })}
                                                            placeholder="Add tag..."
                                                            title="Tags"
                                                        />
                                                    </div>

                                                    {/* Attached Links (Edit Mode) */}
                                                    <div className="pt-2 border-t border-gray-200/10">
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {(note.links || []).map(link => (
                                                                <div key={link.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${styles.bg} ${styles.shadowIn} `}>
                                                                    <span className="opacity-50 uppercase">{link.type}</span>
                                                                    <span className={styles.textMain}>{link.name}</span>
                                                                    <button onClick={() => removeLink(note.id, link.id)} className="hover:text-red-400"><X size={10} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => openLinkPicker('edit')}
                                                            className={`text-[10px] font-bold flex items-center gap-1 ${styles.textSub} hover:text-brand`}
                                                        >
                                                            <Link size={12} /> Attach Link
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // --- VIEW MODE ---
                                                <>
                                                    {/* Priority Dot */}
                                                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${note.priority === 'high' ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]' :
                                                        note.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                                                        } `} />

                                                    <div className="mb-2 flex items-center gap-2">
                                                        {renderIcon(note.category)}
                                                        <span className={`text-[10px] font-bold uppercase opacity-50 ${styles.textSub} `}>{note.category}</span>
                                                    </div>

                                                    <p
                                                        onClick={() => setEditingNoteId(note.id)}
                                                        className={`text-sm font-medium ${styles.textMain} mb-4 cursor-pointer hover:text-brand transition-colors`}
                                                        title="Click to Edit"
                                                    >
                                                        {note.content}
                                                    </p>

                                                    {/* Tags Display */}
                                                    {(note.tags || []).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                            {note.tags!.map((tag, idx) => (
                                                                <span key={idx} className={`px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand/10 text-brand`}>
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Attached Links (View Mode) */}
                                                    {(note.links || []).length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {note.links!.map(link => (
                                                                <div key={link.id} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border border-gray-200/10 ${styles.textSub} `}>
                                                                    {link.type === 'business' && <Building2 size={10} />}
                                                                    {link.type === 'preset' && <LayoutTemplate size={10} />}
                                                                    {link.type === 'style' && <Palette size={10} />}
                                                                    <span className="truncate max-w-[100px]">{link.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/5">
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteNote(note.id)}
                                                            className="text-gray-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>

                                                        <div className="flex gap-1">
                                                            {note.status !== 'todo' && (
                                                                <button
                                                                    onClick={() => moveNote(note.id, note.status === 'done' ? 'in_progress' : 'todo')}
                                                                    className={`p-1.5 rounded hover:bg-white/10 ${styles.textSub} `}
                                                                    title="Move Back"
                                                                >
                                                                    <ChevronLeft size={14} />
                                                                </button>
                                                            )}
                                                            {note.status !== 'done' && (
                                                                <button
                                                                    onClick={() => moveNote(note.id, note.status === 'todo' ? 'in_progress' : 'done')}
                                                                    className={`p-1.5 rounded hover:bg-white/10 ${styles.textSub} hover:text-brand`}
                                                                    title="Move Forward"
                                                                >
                                                                    <ChevronRight size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </NeuCard>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


