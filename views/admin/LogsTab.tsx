import React, { useState } from 'react';
import { NeuCard, NeuButton } from '../../components/NeuComponents';
import { Terminal, Zap, RefreshCw, Check, Copy } from 'lucide-react';
import { populateDatabase } from '../../populate_db';

// LogCard Component (Moved from AdminDashboard.tsx)
const LogCard: React.FC<{ log: any, styles: any }> = ({ log, styles }) => {
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'prompt' | 'thoughts'>('prompt');

    const handleCopy = () => {
        const textToCopy = viewMode === 'prompt' ? log.prompt : (log.metadata?.thoughts || '');
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const hasThoughts = !!log.metadata?.thoughts;

    return (
        <NeuCard className="text-xs">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            } `}>
                            {log.status}
                        </span>
                        <span className={`font-bold ${styles.textMain} `}>{log.businesses?.name || log.business_id}</span>
                        <span className={`text-[10px] ${styles.textSub} font-mono opacity-50`}>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className={`mt-1 font-mono text-[10px] ${styles.textSub} flex items-center gap-2`}>
                        <span>Model: {log.model}</span>
                        <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5 ml-2">
                            <button
                                onClick={() => setViewMode('prompt')}
                                className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${viewMode === 'prompt'
                                    ? 'bg-white dark:bg-white/10 shadow-sm text-brand'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                            >
                                PROMPT
                            </button>
                            <button
                                onClick={() => setViewMode('thoughts')}
                                className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${viewMode === 'thoughts'
                                    ? 'bg-white dark:bg-white/10 shadow-sm text-brand'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                            >
                                THOUGHTS
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-brand"
                    title={`Copy ${viewMode === 'prompt' ? 'Prompt' : 'Thoughts'}`}
                >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
            </div>
            <div className={`p-3 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-[10px] whitespace-pre-wrap ${styles.textSub} overflow-x-auto max-h-60 transition-all`}>
                {viewMode === 'prompt' ? log.prompt : (log.metadata?.thoughts || <span className="opacity-50 italic">No thoughts recorded for this generation.</span>)}
            </div>
            {log.metadata && (
                <div className="mt-2 text-[9px] opacity-50 font-mono truncate">
                    {JSON.stringify({ ...log.metadata, thoughts: log.metadata.thoughts ? '(Hidden in UI)' : undefined })}
                </div>
            )}
        </NeuCard>
    );
};

interface LogsTabProps {
    logs: any[];
    styles: any;
    handleRefresh: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, styles, handleRefresh }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className={`text-lg font-bold ${styles.textMain} flex items-center gap-2`}>
                    <Terminal size={20} /> Generation Logs
                </h3>
                <div className="flex gap-2">
                    <NeuButton type="button" onClick={async () => {
                        if (window.confirm("Are you sure you want to populate the database? This might create duplicates if run twice.")) {
                            await populateDatabase();
                            alert("Database populated!");
                            handleRefresh(); // Refresh the view
                        }
                    }} className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/50">
                        <Zap size={16} /> Populate DB
                    </NeuButton>
                    <NeuButton type="button" onClick={handleRefresh} className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} hover:text-brand`}>
                        <RefreshCw size={20} />
                    </NeuButton>
                </div>
            </div>

            <div className="space-y-3">
                {logs.map((log) => (
                    <LogCard key={log.id} log={log} styles={styles} />
                ))}
                {logs.length === 0 && <div className="text-center opacity-50 py-10">No logs found.</div>}
            </div>
        </div>
    );
};
