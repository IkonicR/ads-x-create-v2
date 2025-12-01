import React, { useState, useEffect, useMemo } from 'react';
import { AdminNote, SystemPrompts, Business, StylePreset, LinkedEntity } from '../types';
import { StorageService } from '../services/storage';
import { DEFAULT_IMAGE_PROMPT, DEFAULT_CHAT_PROMPT, DEFAULT_TASK_PROMPT } from '../services/prompts';
import { NeuTabs, useThemeStyles } from '../components/NeuComponents';
import { LinkPicker } from '../components/LinkPicker';
import { Map, Wallet, FileText, Settings, Brain } from 'lucide-react';

// Sub-components
import { RoadmapTab } from './admin/RoadmapTab';
import { BrainTab } from './admin/BrainTab';
import { ConfigTab } from './admin/ConfigTab';
import { AccountsTab } from './admin/AccountsTab';
import { LogsTab } from './admin/LogsTab';

const AdminDashboard: React.FC<{ onBusinessUpdated?: (business: Business) => void }> = ({ onBusinessUpdated }) => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'brain' | 'credits' | 'config' | 'logs'>('roadmap');

  // Roadmap State
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [category, setCategory] = useState<AdminNote['category']>('Idea');
  const [newNotePriority, setNewNotePriority] = useState<AdminNote['priority']>('medium');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteLinks, setNewNoteLinks] = useState<LinkedEntity[]>([]);
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
  const [linkPickerTarget, setLinkPickerTarget] = useState<'new' | 'edit'>('new');
  const [filterCategory, setFilterCategory] = useState<'All' | AdminNote['category']>('All');
  const [filterPriority, setFilterPriority] = useState<'All' | AdminNote['priority']>('All');
  const [filterTag, setFilterTag] = useState<string>('All');

  // Brain State
  const [prompts, setPrompts] = useState<SystemPrompts>({
    chatPersona: '',
    imageGenRules: '',
    taskGenRules: ''
  });

  // Config State
  const [stylesList, setStylesList] = useState<StylePreset[]>([]);

  // Accounts State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Logs State
  const [logs, setLogs] = useState<any[]>([]);

  const { styles } = useThemeStyles();

  // --- LAZY LOADING LOGIC ---
  useEffect(() => {
    if (activeTab === 'roadmap' && notes.length === 0) StorageService.getAdminNotes().then(setNotes);
    if (activeTab === 'brain') StorageService.getSystemPrompts().then(p => p && setPrompts(p));
    if (activeTab === 'credits' && businesses.length === 0) StorageService.getBusinesses().then(setBusinesses);
    if (activeTab === 'config' && stylesList.length === 0) StorageService.getStyles().then(setStylesList);
    if (activeTab === 'logs' && logs.length === 0) StorageService.getGenerationLogs().then(setLogs);
  }, [activeTab]);

  // Initial Load
  useEffect(() => {
    StorageService.getAdminNotes().then(setNotes);
  }, []);

  const handleRefresh = async () => {
    if (activeTab === 'roadmap') await StorageService.getAdminNotes().then(setNotes);
    if (activeTab === 'brain') await StorageService.getSystemPrompts().then(p => p && setPrompts(p));
    if (activeTab === 'credits') await StorageService.getBusinesses().then(setBusinesses);
    if (activeTab === 'config') await StorageService.getStyles().then(setStylesList);
    if (activeTab === 'logs') await StorageService.getGenerationLogs().then(setLogs);
  };

  // --- HANDLERS ---

  // Roadmap Handlers
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const note: AdminNote = {
      id: Date.now().toString(),
      content: newNote,
      category,
      status: 'todo',
      priority: newNotePriority,
      createdAt: new Date().toISOString(),
      links: newNoteLinks,
      tags: newNoteTags
    };
    const updated = [note, ...notes];
    setNotes(updated);
    await StorageService.saveAdminNotes(updated);
    setNewNote('');
    setNewNoteLinks([]);
    setNewNoteTags([]);
  };

  const handleUpdateNote = async (id: string, updates: Partial<AdminNote>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...updates } : n);
    setNotes(updated);
    await StorageService.saveAdminNotes(updated);
  };

  const deleteNote = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await StorageService.saveAdminNotes(updated);
  };

  const moveNote = async (id: string, newStatus: AdminNote['status']) => {
    const updated = notes.map(n => n.id === id ? { ...n, status: newStatus } : n);
    setNotes(updated);
    await StorageService.saveAdminNotes(updated);
  };

  // Link Handlers
  const handleLinkSelect = (entity: LinkedEntity) => {
    if (linkPickerTarget === 'new') {
      if (!newNoteLinks.find(l => l.id === entity.id)) {
        setNewNoteLinks([...newNoteLinks, entity]);
      }
    } else if (editingNoteId) {
      const note = notes.find(n => n.id === editingNoteId);
      if (note && !note.links?.find(l => l.id === entity.id)) {
        const updatedLinks = [...(note.links || []), entity];
        handleUpdateNote(editingNoteId, { links: updatedLinks });
      }
    }
    setIsLinkPickerOpen(false);
  };

  const removeLink = (noteId: string | 'new', linkId: string) => {
    if (noteId === 'new') {
      setNewNoteLinks(newNoteLinks.filter(l => l.id !== linkId));
    } else {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        const updatedLinks = (note.links || []).filter(l => l.id !== linkId);
        handleUpdateNote(noteId, { links: updatedLinks });
      }
    }
  };

  const openLinkPicker = (target: 'new' | 'edit') => {
    setLinkPickerTarget(target);
    setIsLinkPickerOpen(true);
  };

  // Brain Handlers
  const handleSavePrompts = async () => {
    await StorageService.saveSystemPrompts(prompts);
    alert('System Prompts Updated');
  };

  // Accounts Handlers
  const handleUpdateCredits = async (businessId: string, newAmount: string) => {
    const amount = parseInt(newAmount);
    if (isNaN(amount)) return;
    const updatedBusinesses = businesses.map(b => b.id === businessId ? { ...b, credits: amount } : b);
    setBusinesses(updatedBusinesses);
    const businessToSave = updatedBusinesses.find(b => b.id === businessId);
    if (businessToSave) {
      await StorageService.saveBusiness(businessToSave);
      if (onBusinessUpdated) onBusinessUpdated(businessToSave);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${styles.textMain}`}>Admin HQ</h2>
          <p className={styles.textSub}>Control Center for Ads x Create</p>
        </div>

        <NeuTabs
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          tabs={[
            { id: 'roadmap', label: 'Roadmap', icon: <Map size={14} /> },
            { id: 'brain', label: 'Brain Logic', icon: <Brain size={14} /> },
            { id: 'config', label: 'Config', icon: <Settings size={14} /> },
            { id: 'credits', label: 'Accounts', icon: <Wallet size={14} /> },
            { id: 'logs', label: 'Logs', icon: <FileText size={14} /> },
          ]}
        />
      </header>

      {activeTab === 'roadmap' && (
        <RoadmapTab
          notes={notes}
          styles={styles}
          newNote={newNote}
          setNewNote={setNewNote}
          category={category}
          setCategory={setCategory}
          newNotePriority={newNotePriority}
          setNewNotePriority={setNewNotePriority}
          newNoteLinks={newNoteLinks}
          handleAddNote={handleAddNote}
          removeLink={removeLink}
          openLinkPicker={openLinkPicker}
          handleUpdateNote={handleUpdateNote}
          deleteNote={deleteNote}
          moveNote={moveNote}
          editingNoteId={editingNoteId}
          setEditingNoteId={setEditingNoteId}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterTag={filterTag}
          setFilterTag={setFilterTag}
          newNoteTags={newNoteTags}
          setNewNoteTags={setNewNoteTags}
        />
      )}

      {activeTab === 'brain' && (
        <BrainTab
          prompts={prompts}
          setPrompts={setPrompts}
          handleSavePrompts={handleSavePrompts}
          styles={styles}
        />
      )}

      {activeTab === 'config' && (
        <ConfigTab
          stylesList={stylesList}
          setStylesList={setStylesList}
          styles={styles}
          handleRefresh={handleRefresh}
        />
      )}

      {activeTab === 'credits' && (
        <AccountsTab
          businesses={businesses}
          handleUpdateCredits={handleUpdateCredits}
          handleRefresh={handleRefresh}
          styles={styles}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      )}

      {activeTab === 'logs' && (
        <LogsTab
          logs={logs}
          styles={styles}
          handleRefresh={handleRefresh}
        />
      )}

      <LinkPicker
        isOpen={isLinkPickerOpen}
        onClose={() => setIsLinkPickerOpen(false)}
        onSelect={handleLinkSelect}
        businesses={businesses}
        stylesList={stylesList}
      />
    </div>
  );
};

export default AdminDashboard;
