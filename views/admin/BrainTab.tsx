import React, { useState } from 'react';
import { SystemPrompts } from '../../types';
import { NeuButton, NeuTextArea } from '../../components/NeuComponents';
import { Image as ImageIcon, MessageSquare, ListTodo, Terminal, ArrowRight, Eye, Save } from 'lucide-react';
import { DEFAULT_IMAGE_PROMPT, DEFAULT_CHAT_PROMPT, DEFAULT_TASK_PROMPT } from '../../services/prompts';

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

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 border-b border-gray-200/10 pb-4">
                {[
                    { id: 'image', label: 'Image Generator', icon: ImageIcon },
                    { id: 'chat', label: 'Chat Persona', icon: MessageSquare },
                    { id: 'tasks', label: 'Task Engine', icon: ListTodo },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setBrainTab(tab.id as any)}
                        className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all border-b-2 ${brainTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-600'
                            } `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Terminal size={16} className={styles.textSub} />
                            <h4 className={`text-sm font-bold ${styles.textSub} uppercase`}>Factory Default</h4>
                        </div>
                        <button
                            onClick={loadDefaultPrompt}
                            className={`text-[10px] font-bold px-2 py-1 rounded ${styles.bg} ${styles.shadowOut} hover:text-brand flex items-center gap-1`}
                            title="Copy to Override"
                        >
                            Use This <ArrowRight size={10} />
                        </button>
                    </div>
                    <div className={`p-4 rounded-2xl ${styles.bg} ${styles.shadowIn} font-mono text-[10px] h-[400px] overflow-y-auto whitespace-pre-wrap ${styles.textSub} `}>
                        {getCurrentDefault()}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Eye size={16} className="text-purple-500" />
                        <h4 className={`text-sm font-bold ${styles.textMain} uppercase`}>Admin Override (Live)</h4>
                    </div>
                    <NeuTextArea
                        className="font-mono text-[10px] h-[400px] whitespace-pre-wrap"
                        placeholder={`Paste the Default Prompt here to start editing ${brainTab} logic...`}
                        value={getCurrentValue()}
                        onChange={(e) => handlePromptChange(e.target.value)}
                    />
                    <p className={`text-xs ${styles.textSub} mt-2`}>
                        * If this box is empty, the default prompt on the left is used.
                        * Placeholders (e.g., <code>{'{BUSINESS_NAME}'}</code>) are dynamically replaced.
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200/10">
                <NeuButton type="button" variant="primary" onClick={handleSavePrompts}>
                    <Save size={18} /> Save Brain Logic
                </NeuButton>
            </div>
        </div>
    );
};
