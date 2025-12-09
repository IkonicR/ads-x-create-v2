import React, { useState } from 'react';
import { SystemPrompts } from '../../types';
import { NeuButton, NeuTextArea } from '../../components/NeuComponents';
import { Image as ImageIcon, MessageSquare, ListTodo, Terminal, ArrowRight, Eye, Save } from 'lucide-react';
import { DEFAULT_IMAGE_PROMPT, DEFAULT_CHAT_PROMPT, DEFAULT_TASK_PROMPT } from '../../services/prompts';
import { VariableReferenceList } from '../../components/VariableReferenceList';

interface BrainTabProps {
    prompts: SystemPrompts;
    setPrompts: (val: SystemPrompts) => void;
    handleSavePrompts: () => void;
    styles: any;
}

export const BrainTab: React.FC<BrainTabProps> = ({ prompts, setPrompts, handleSavePrompts, styles }) => {
    const [brainTab, setBrainTab] = useState<'image' | 'chat' | 'tasks'>('image');

    const loadDefaultPrompt = () => {
        if (brainTab === 'image') setPrompts({ ...prompts, imageGenRules: DEFAULT_IMAGE_PROMPT });
        if (brainTab === 'chat') setPrompts({ ...prompts, chatPersona: DEFAULT_CHAT_PROMPT });
        if (brainTab === 'tasks') setPrompts({ ...prompts, taskGenRules: DEFAULT_TASK_PROMPT });
    };

    const getCurrentDefault = () => {
        if (brainTab === 'image') return DEFAULT_IMAGE_PROMPT;
        if (brainTab === 'chat') return DEFAULT_CHAT_PROMPT;
        return DEFAULT_TASK_PROMPT;
    };

    const getCurrentValue = () => {
        if (brainTab === 'image') return prompts.imageGenRules;
        if (brainTab === 'chat') return prompts.chatPersona;
        return prompts.taskGenRules;
    };

    const handlePromptChange = (val: string) => {
        if (brainTab === 'image') setPrompts({ ...prompts, imageGenRules: val });
        if (brainTab === 'chat') setPrompts({ ...prompts, chatPersona: val });
        if (brainTab === 'tasks') setPrompts({ ...prompts, taskGenRules: val });
    };

    const handleResetToDefault = () => {
        if (window.confirm("Are you sure you want to reset to the factory default? This will clear your custom override.")) {
            // Setting to empty string triggers the fallback to default in the logic
            handlePromptChange("");
        }
    };

    const handlePasteAndSave = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;

            handlePromptChange(text);
            // Small delay to ensure state updates before saving (though in React 18+ batching might handle it, explicit is safer for the callback)
            setTimeout(() => {
                handleSavePrompts();
            }, 100);
        } catch (err) {
            console.error('Failed to read clipboard', err);
            alert('Failed to read clipboard. Please allow clipboard access.');
        }
    };

    const isUsingDefault = !getCurrentValue() || getCurrentValue().trim() === "";

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 border-b border-gray-200/10 pb-4 overflow-x-auto">
                {[
                    { id: 'image', label: 'Image Generator', icon: ImageIcon },
                    { id: 'chat', label: 'Chat Persona', icon: MessageSquare },
                    { id: 'tasks', label: 'Task Engine', icon: ListTodo },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setBrainTab(tab.id as any)}
                        className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${brainTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-600'
                            } `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Variable Reference Sidebar (New) */}
                <div className="lg:col-span-3 order-2 lg:order-1 h-[60vh] min-h-[500px] border-r border-gray-200/10 pr-4">
                    <VariableReferenceList />
                </div>

                {/* Editor Column */}
                <div className="lg:col-span-9 order-1 lg:order-2 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Eye size={16} className="text-purple-500" />
                            <h4 className={`text-sm font-bold ${styles.textMain} uppercase`}>Admin Override (Live)</h4>
                            {isUsingDefault && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                    Using Default
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={loadDefaultPrompt}
                                className={`text-[10px] font-bold px-2 py-1 rounded ${styles.bg} ${styles.shadowOut} hover:text-brand flex items-center gap-1 mr-2`}
                                title="Copy Factory Default to Edit"
                            >
                                Load Default <ArrowRight size={10} />
                            </button>
                            <button
                                onClick={handleResetToDefault}
                                className="text-[10px] font-bold px-2 py-1 rounded hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors"
                                title="Reset to Factory Default"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handlePasteAndSave}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-brand/10 text-brand hover:bg-brand/20 transition-colors flex items-center gap-1"
                                title="Paste from Clipboard and Save immediately"
                            >
                                Paste & Save
                            </button>
                        </div>
                    </div>

                    <div className="relative flex-grow">
                        <NeuTextArea
                            className={`font-mono text-[10px] h-[60vh] min-h-[500px] whitespace-pre-wrap w-full ${isUsingDefault ? 'opacity-50' : ''}`}
                            placeholder={`Paste the Default Prompt here to start editing ${brainTab} logic...`}
                            value={getCurrentValue()}
                            onChange={(e) => handlePromptChange(e.target.value)}
                        />
                        {isUsingDefault && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-xs font-mono">
                                    (Using Factory Default)
                                </div>
                            </div>
                        )}
                    </div>

                    <p className={`text-xs ${styles.textSub} mt-2`}>
                        * If this box is empty, the default prompt is used.
                        * Use the sidebar to copy available variables.
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200/10 sticky bottom-0 bg-inherit py-4 z-10">
                <NeuButton type="button" variant="primary" onClick={handleSavePrompts}>
                    <Save size={18} /> Save Brain Logic
                </NeuButton>
            </div>
        </div>
    );
};
