/**
 * PillarBuilderChat - Left panel chat interface for pillar creation
 * 
 * Features:
 * - Suggestion cards before first message
 * - AI-guided conversation using Gemini 3 Flash
 * - Updates draft as user provides info via function calling
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Business, SocialAccount, ContentPillar, StylePreset } from '../types';
import { PillarDraft } from './PillarBuilder';
import { useThemeStyles, NeuButton, NeuCard, NeuInput, NeuIconButton } from './NeuComponents';
import { MarkdownRenderer } from './MarkdownRenderer';
import { sendPillarChatMessage, getInitialGreeting, PillarChatMessage } from '../services/pillarChatService';
import {
    Send, Sparkles, Target, Users, MessageSquare,
    BookOpen, Calendar, Loader2, Bot, User
} from 'lucide-react';

interface PillarBuilderChatProps {
    business: Business;
    connectedAccounts: SocialAccount[];
    availableStyles: StylePreset[];
    draft: PillarDraft;
    onDraftUpdate: (updates: Partial<PillarDraft>) => void;
    existingPillar?: ContentPillar | null;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Suggestion card presets
const SUGGESTION_CARDS = [
    {
        id: 'motivation',
        icon: <Sparkles size={20} />,
        title: 'Motivation Monday',
        description: 'Weekly inspiration for your audience',
        prompt: 'I want to create a Motivation Monday pillar that posts inspirational content every Monday',
    },
    {
        id: 'product',
        icon: <Target size={20} />,
        title: 'Product Spotlight',
        description: 'Feature your offerings regularly',
        prompt: 'I want to showcase a different product every Friday with a sale vibe',
    },
    {
        id: 'team',
        icon: <Users size={20} />,
        title: 'Meet the Team',
        description: 'Humanize your brand with team features',
        prompt: 'I want to introduce a team member every Wednesday to build connection with my audience',
    },
    {
        id: 'tips',
        icon: <BookOpen size={20} />,
        title: 'Tip Tuesday',
        description: 'Share expertise and build authority',
        prompt: 'I want to share helpful tips related to my industry every Tuesday',
    },
];

export const PillarBuilderChat: React.FC<PillarBuilderChatProps> = ({
    business,
    connectedAccounts,
    availableStyles,
    draft,
    onDraftUpdate,
    existingPillar,
}) => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

    // localStorage key for chat persistence
    const STORAGE_KEY_CHAT = `pillar_chat_${business.id}`;

    // Initialize messages from localStorage cache (if available)
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        // Skip cache if editing existing pillar
        if (existingPillar) return [];
        
        try {
            const savedChat = localStorage.getItem(STORAGE_KEY_CHAT);
            if (savedChat) {
                const parsed = JSON.parse(savedChat);
                return parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
            }
        } catch { /* ignore */ }
        return [];
    });
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Save messages to localStorage on update
    useEffect(() => {
        if (existingPillar) return; // Don't save when editing existing
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
        }
    }, [messages, existingPillar, STORAGE_KEY_CHAT]);

    // Initial AI greeting (only if no cached messages)
    useEffect(() => {
        if (messages.length === 0 && !existingPillar) {
            setMessages([{
                id: 'greeting',
                role: 'assistant',
                content: `Hey! Let's create a recurring content pillar for ${business.name}. What kind of content do you want to post regularly? Pick a suggestion below or describe your own idea.`,
                timestamp: new Date(),
            }]);
        }
    }, [business.name, existingPillar, messages.length]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle suggestion card click
    const handleSuggestionClick = (suggestion: typeof SUGGESTION_CARDS[0]) => {
        setInput(suggestion.prompt);
        inputRef.current?.focus();
    };

    // Handle send message
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: PillarChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Use real AI service for pillar chat
            const { response, updates } = await sendPillarChatMessage(
                business,
                connectedAccounts,
                availableStyles,
                messages,
                userMessage.content,
                draft
            );

            // Apply any extracted updates to the draft
            if (Object.keys(updates).length > 0) {
                onDraftUpdate(updates);
            }

            // Add AI response to messages
            setMessages(prev => [...prev, {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            }]);
        } catch (error) {
            console.error('[PillarBuilderChat] Error:', error);
            setMessages(prev => [...prev, {
                id: `ai-error-${Date.now()}`,
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting. Please try again.",
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle keyboard
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const showSuggestions = messages.length <= 1;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <h2 className={`text-lg font-bold ${styles.textMain}`}>
                    {existingPillar ? 'Edit Pillar' : 'Create Content Pillar'}
                </h2>
                <p className={`text-sm ${styles.textSub}`}>
                    Tell me what you want, I'll set it up
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                msg.role === 'assistant'
                                    ? `${styles.bg} ${styles.shadowOut} text-brand`
                                    : `bg-brand text-white shadow-md`
                            }`}>
                                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[80%] p-3 rounded-xl text-base leading-relaxed ${
                                msg.role === 'assistant'
                                    ? `${styles.bg} ${styles.shadowOut} ${styles.textMain}`
                                    : `${styles.bg} ${styles.shadowIn} ${styles.textMain} border-l-4 border-brand`
                            }`}>
                                {msg.role === 'assistant' ? (
                                    <MarkdownRenderer content={msg.content} className="text-base" />
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}


                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start mr-8"
                    >
                        <NeuCard className="px-4 py-3 max-w-[85%]">
                            <div className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-brand" />
                                <span className={`text-xs ${styles.textSub} italic`}>Thinking...</span>
                            </div>
                        </NeuCard>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Cards (only before first user message) */}
            {showSuggestions && (
                <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <p className={`text-xs ${styles.textSub} mb-3 pt-4`}>Quick Start</p>
                    <div className="grid grid-cols-2 gap-2">
                        {SUGGESTION_CARDS.map((card) => (
                            <NeuCard
                                key={card.id}
                                onClick={() => handleSuggestionClick(card)}
                                className="p-3 cursor-pointer group hover:border-brand/40"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-brand group-hover:scale-110 transition-transform">
                                        {card.icon}
                                    </span>
                                    <span className={`text-sm font-bold ${styles.textMain}`}>{card.title}</span>
                                </div>
                                <p className={`text-xs ${styles.textSub} line-clamp-2`}>{card.description}</p>
                            </NeuCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <NeuInput
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe what you want..."
                            className="w-full text-base"
                        />
                    </div>
                    <NeuButton
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        variant="primary"
                        className="h-[46px] w-[46px] !p-0 flex items-center justify-center shrink-0"
                    >
                        <Send size={18} />
                    </NeuButton>
                </div>
            </div>
        </div>
    );
};

export default PillarBuilderChat;
