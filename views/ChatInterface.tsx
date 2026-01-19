
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Business, ChatMessage } from '../types';
import { NeuCard, NeuButton, NeuIconButton, useThemeStyles } from '../components/NeuComponents';
import { Send, Bot, User, Sparkles, Download, Box, X, History } from 'lucide-react';
import { sendChatMessage, pollJobStatus, generateChatTitle } from '../services/geminiService';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { SubjectPicker } from '../components/SubjectPicker';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { QuickActionPills, QuickEditInput } from '../components/QuickActionPills';
import { ChatHistoryPopover } from '../components/ChatHistoryPopover';
import * as chatService from '../services/chatService';
import { ChatSession } from '../services/chatService';

interface ChatInterfaceProps {
  business: Business;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ business }) => {
  const { styles } = useThemeStyles();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [attachedSubject, setAttachedSubject] = useState<{ id: string; name: string; type: 'product' | 'person'; imageUrl?: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [pendingJobIds, setPendingJobIds] = useState<string[]>([]);  // Phase 5: Multiple jobs
  const [recentGeneratedImage, setRecentGeneratedImage] = useState<string | null>(null);  // Phase 6: For AI vision
  const [editMode, setEditMode] = useState<string | null>(null); // Phase 8: Inline editing
  const [resizeMode, setResizeMode] = useState<string | null>(null); // Phase 8: Resize interactions
  const [showHistory, setShowHistory] = useState(false);  // History popover
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);

  // Generate the welcome message
  const getWelcomeMessage = useCallback((): ChatMessage => ({
    id: 'welcome',
    role: 'ai',
    text: `Hi! I'm your Creative Director for ${business.name}. It's ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}. Need ideas for upcoming holidays or a new product launch?`,
    timestamp: new Date()
  }), [business.name]);

  // Initialize messages from cache INSTANTLY (no loading state)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = chatService.getCachedChat(business.id);
    if (cached && cached.messages.length > 0) {
      return cached.messages.map(m => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: new Date(m.timestamp),
        attachment: m.attachment
      }));
    }
    // No cache - return welcome message immediately
    return [{
      id: 'welcome',
      role: 'ai',
      text: `Hi! I'm your Creative Director for ${business.name}. It's ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}. Need ideas for upcoming holidays or a new product launch?`,
      timestamp: new Date()
    }];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to update cache
  const updateCache = useCallback((msgs: ChatMessage[], sessId: string | null) => {
    if (!sessId) return;
    chatService.setCachedChat(business.id, {
      sessionId: sessId,
      messages: msgs.map(m => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp.toISOString(),
        attachment: m.attachment
      })),
      lastSyncedAt: new Date().toISOString()
    });
  }, [business.id]);

  // Background sync with database (non-blocking)
  useEffect(() => {
    const syncWithDatabase = async () => {
      try {
        // Only FIND existing session (don't create on mount)
        const session = await chatService.findActiveSession(business.id);
        if (!session) return; // No session yet - will create on first message

        setSessionId(session.id);

        // Check if cache matches this session
        const cached = chatService.getCachedChat(business.id);

        if (cached?.sessionId === session.id) {
          // Cache is for correct session - just update sessionId, no need to reload
          return;
        }

        // Session mismatch or no cache - load from DB
        const dbMessages = await chatService.loadMessages(session.id);

        if (dbMessages.length > 0) {
          const loadedMessages: ChatMessage[] = dbMessages.map(m => ({
            id: m.id,
            role: m.role,
            text: m.content,
            timestamp: new Date(m.created_at),
            attachment: m.attachment_url ? {
              type: 'image' as const,
              content: m.attachment_url
            } : undefined
          }));
          setMessages(loadedMessages);
          updateCache(loadedMessages, session.id);
        } else {
          // New session - save welcome message
          const welcome = getWelcomeMessage();
          await chatService.saveMessage(session.id, 'ai', welcome.text);
          updateCache([welcome], session.id);
        }
      } catch (error) {
        console.error('[ChatInterface] Background sync failed:', error);
      }
    };

    syncWithDatabase();
  }, [business.id, getWelcomeMessage, updateCache]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Phase 3/5/6: Poll for image generation completion
  // isBatch: true if this is one of multiple jobs
  const pollForCompletion = useCallback(async (jobId: string, messageId: string, isBatch: boolean = false) => {
    const maxAttempts = 90; // 90 seconds timeout
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const status = await pollJobStatus(jobId);

        if (status.status === 'completed' && status.asset?.content) {
          // Phase 6: Store for AI vision
          setRecentGeneratedImage(status.asset.content);

          if (isBatch) {
            // Phase 5: Batch mode - add to attachments array
            setMessages(prev => prev.map(m => {
              if (m.id !== messageId) return m;
              const existingAttachments = m.attachments || [];
              return {
                ...m,
                attachments: [...existingAttachments, { type: 'image' as const, content: status.asset.content }],
                imageUrl: status.asset.content  // Store for AI vision
              };
            }));
            // Remove this job from pending
            setPendingJobIds(prev => prev.filter(id => id !== jobId));
          } else {
            // Single mode - use attachment
            setMessages(prev => prev.map(m =>
              m.id === messageId
                ? {
                  ...m,
                  attachment: { type: 'image', content: status.asset.content },
                  imageUrl: status.asset.content  // Phase 6: Store for AI vision
                }
                : m
            ));
            setPendingJobId(null);
          }

          // Update cache with image
          setMessages(prev => {
            updateCache(prev, sessionId);
            return prev;
          });
        } else if (status.status === 'failed') {
          // Handle failure
          if (isBatch) {
            setPendingJobIds(prev => prev.filter(id => id !== jobId));
          } else {
            setMessages(prev => prev.map(m =>
              m.id === messageId
                ? { ...m, text: m.text + '\n\n⚠️ Generation failed. Please try again.' }
                : m
            ));
            setPendingJobId(null);
          }
        } else if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(poll, 1000);
        } else {
          // Timeout
          if (isBatch) {
            setPendingJobIds(prev => prev.filter(id => id !== jobId));
          } else {
            setMessages(prev => prev.map(m =>
              m.id === messageId
                ? { ...m, text: m.text + '\n\n⚠️ Generation timed out. Check the Generator tab.' }
                : m
            ));
            setPendingJobId(null);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (isBatch) {
          setPendingJobIds(prev => prev.filter(id => id !== jobId));
        } else {
          setPendingJobId(null);
        }
      }
    };

    poll();
  }, [sessionId, updateCache]);

  const handleSend = async (overrideText?: string) => {
    const userText = overrideText || input.trim();
    if (!userText || loading) return;

    setInput('');
    setLoading(true);
    setEditMode(null); // Clear edit mode if active

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    updateCache(newMessages, sessionId);

    try {
      // Create session on first message if none exists (lazy creation)
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const newSession = await chatService.createSession(business.id);
        if (newSession) {
          currentSessionId = newSession.id;
          setSessionId(newSession.id);
          // Save welcome message too
          await chatService.saveMessage(newSession.id, 'ai', getWelcomeMessage().text);
        }
      }

      // Save user message to DB
      if (currentSessionId) {
        const savedUserMsg = await chatService.saveMessage(currentSessionId, 'user', userText);
        if (savedUserMsg) {
          setMessages(prev => prev.map(m =>
            m.id === userMsg.id ? { ...m, id: savedUserMsg.id } : m
          ));
        }

        // Generate AI title on first user message (background, no await)
        const userMessageCount = messages.filter(m => m.role === 'user').length;
        if (userMessageCount === 0) {
          generateChatTitle(userText).then(title => {
            chatService.updateSessionTitle(currentSessionId!, title);
          });
        }
      }

      // Check API Key via AI Studio
      // @ts-ignore
      if (typeof window !== 'undefined' && window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }

      // Call API with History (Phase 6: include imageUrl for multimodal context)
      const historyForApi = messages.map(m => ({ role: m.role, text: m.text, imageUrl: m.imageUrl }));
      const aiResponse = await sendChatMessage(business, historyForApi, userText, attachedSubject || undefined, recentGeneratedImage || undefined);

      // Clear attachment after sending
      setAttachedSubject(null);

      // Create AI message
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'ai',
        text: aiResponse.text,
        timestamp: new Date(),
        attachment: aiResponse.image ? {
          type: 'image',
          content: aiResponse.image
        } : undefined
      };

      // Save AI response to DB
      if (sessionId) {
        const savedAiMsg = await chatService.saveMessage(
          sessionId,
          'ai',
          aiResponse.text,
          aiResponse.image ? 'image' : undefined,
          aiResponse.image
        );
        if (savedAiMsg) {
          aiMsg.id = savedAiMsg.id;
        }
      }

      setMessages(prev => {
        const updated = [...prev, aiMsg];
        updateCache(updated, sessionId);
        return updated;
      });

      // Phase 3/5: Start polling if AI triggered image generation
      if (aiResponse.jobId) {
        // Single image generation
        setPendingJobId(aiResponse.jobId);
        pollForCompletion(aiResponse.jobId, aiMsg.id, false);
      } else if (aiResponse.jobIds && aiResponse.jobIds.length > 0) {
        // Phase 5: Batch generation - poll for each job
        setPendingJobIds(aiResponse.jobIds);
        for (const jobId of aiResponse.jobIds) {
          pollForCompletion(jobId, aiMsg.id, true);
        }
      }

    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'ai',
        text: "Sorry, I had a creative block (API Error). Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    // Clear cache immediately
    chatService.clearCachedChat(business.id);

    // Reset to welcome message
    const welcome = getWelcomeMessage();
    setMessages([welcome]);

    // Create new session in background
    const newSession = await chatService.resetSession(business.id);
    if (newSession) {
      setSessionId(newSession.id);
      await chatService.saveMessage(newSession.id, 'ai', welcome.text);
      updateCache([welcome], newSession.id);
    }
  };

  // Load all sessions for history dropdown
  const loadAllSessions = async () => {
    const sessions = await chatService.getAllSessions(business.id);
    setAllSessions(sessions);
  };

  // Switch to a different session
  const handleLoadSession = async (session: ChatSession) => {
    setShowHistory(false);
    const messages = await chatService.loadMessages(session.id);
    setMessages(messages.map(m => ({
      id: m.id,
      role: m.role,
      text: m.content,
      timestamp: new Date(m.created_at),
      attachment: m.attachment_url ? { type: 'image' as const, content: m.attachment_url } : undefined
    })));
    setSessionId(session.id);
    // Update cache
    updateCache(messages.map(m => ({
      id: m.id,
      role: m.role,
      text: m.content,
      timestamp: new Date(m.created_at),
      attachment: m.attachment_url ? { type: 'image' as const, content: m.attachment_url } : undefined
    })), session.id);
  };

  // New chat from history popover
  const handleNewChat = async () => {
    setShowHistory(false);
    await handleReset();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 pb-2">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <GalaxyHeading
            text="Creative Director"
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
          />
          <p className={styles.textSub}>Brainstorming ideas for {business.name} based on {business.industry} trends.</p>
        </div>
        <div className="flex gap-2 relative">
          <NeuButton
            className="text-sm py-2"
            onClick={() => {
              loadAllSessions();
              setShowHistory(!showHistory);
            }}
          >
            <History size={16} /> History
          </NeuButton>
          <NeuButton className="text-sm py-2" onClick={handleReset}>Reset Chat</NeuButton>

          {showHistory && (
            <ChatHistoryPopover
              sessions={allSessions}
              activeSessionId={sessionId}
              onSelect={handleLoadSession}
              onNewChat={handleNewChat}
              onClose={() => setShowHistory(false)}
            />
          )}
        </div>
      </header>

      {showPicker && (
        <SubjectPicker
          business={business}
          onSelect={(subject) => {
            setAttachedSubject(subject);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Chat Window */}
      <NeuCard
        className="flex-1 overflow-hidden flex flex-col relative"
        inset
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai'
                ? `${styles.bg} ${styles.shadowOut} text-brand`
                : `bg-brand text-white shadow-md`
                }`}>
                {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>

              {/* Content Column */}
              <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai'
                  ? `${styles.bg} ${styles.shadowOut} ${styles.textMain}`
                  : `${styles.bg} ${styles.shadowIn} ${styles.textMain} border-l-4 border-brand whitespace-pre-wrap`
                  }`}>
                  {msg.role === 'ai' ? (
                    <MarkdownRenderer content={msg.text} />
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Image Attachment */}
                {msg.attachment && msg.attachment.type === 'image' && (
                  <div className={`mt-4 rounded-2xl overflow-hidden p-2 ${styles.bg} ${styles.shadowOut} animate-fade-in max-w-sm`}>
                    <div className="relative group">
                      <img src={msg.attachment.content} alt="Generated" className="w-full h-auto rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <button className="bg-white text-black p-2 rounded-full font-bold flex items-center gap-2 text-xs">
                          <Download size={14} /> Save to Library
                        </button>
                      </div>
                    </div>
                    <div className={`mt-2 px-2 flex justify-between items-center ${styles.textSub} text-xs`}>
                      <span className="font-bold">AI GENERATED</span>
                      <Sparkles size={12} className="text-brand" />
                    </div>

                    {/* Phase 8: Quick Action Pills */}
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <QuickActionPills
                        isEditMode={editMode === msg.id}
                        onVariations={() => {
                          setRecentGeneratedImage(msg.attachment!.content);
                          handleSend("Generate 3 variations of this image");
                        }}
                        onEdit={() => setEditMode(editMode === msg.id ? null : msg.id)}
                        onDifferentStyle={() => {
                          setRecentGeneratedImage(msg.attachment!.content);
                          handleSend("Keep the same subject but try a completely different artistic style");
                        }}
                        onResize={() => {
                          setRecentGeneratedImage(msg.attachment!.content);
                          handleSend("Resize this to 9:16 Story format");
                        }}
                        onSave={() => {
                          console.log("Save clicked");
                        }}
                      />

                      {/* Inline Edit Input */}
                      <AnimatePresence>
                        {editMode === msg.id && (
                          <QuickEditInput
                            onSubmit={(value) => {
                              setRecentGeneratedImage(msg.attachment!.content);
                              handleSend(value);
                            }}
                            onCancel={() => setEditMode(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Phase 5: Multiple Image Attachments (Grid) */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className={`mt-4 grid ${msg.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 max-w-md`}>
                    {msg.attachments.map((att, i) => (
                      <div key={i} className={`rounded-2xl overflow-hidden p-2 ${styles.bg} ${styles.shadowOut} animate-fade-in`}>
                        <div className="relative group">
                          <img src={att.content} alt={`Generated ${i + 1}`} className="w-full h-auto rounded-xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <button className="bg-white text-black p-2 rounded-full font-bold flex items-center gap-2 text-xs">
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                        <div className={`mt-1 px-2 flex justify-between items-center ${styles.textSub} text-xs`}>
                          <span className="font-bold">#{i + 1}</span>
                          <Sparkles size={10} className="text-brand" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Generating Indicator - shows while polling for single image */}
                {pendingJobId && msg.role === 'ai' && !msg.attachment && msg.text.includes('Creating your image') && (
                  <div className={`mt-4 rounded-2xl overflow-hidden p-4 ${styles.bg} ${styles.shadowIn} max-w-sm`}>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      <span className={`text-sm font-medium ${styles.textSub}`}>Generating image...</span>
                    </div>
                  </div>
                )}

                {/* Phase 5: Batch Generating Indicator */}
                {pendingJobIds.length > 0 && msg.role === 'ai' && msg.text.includes('Creating') && msg.text.includes('images') && (
                  <div className={`mt-4 rounded-2xl overflow-hidden p-4 ${styles.bg} ${styles.shadowIn} max-w-sm`}>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      <span className={`text-sm font-medium ${styles.textSub}`}>
                        Generating {pendingJobIds.length} image{pendingJobIds.length > 1 ? 's' : ''}...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${styles.bg} ${styles.shadowOut} text-brand`}>
                <Bot size={20} />
              </div>
              <div className={`p-4 rounded-2xl ${styles.bg} ${styles.shadowOut} text-sm`}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4">
          {/* Attached Subject Pill */}
          {attachedSubject && (
            <div className="flex items-center gap-2 mb-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${styles.bg} ${styles.shadowOut} border border-brand/20`}>
                <span className="text-xs font-bold text-brand uppercase">{attachedSubject.type}</span>
                <span className={`text-sm font-bold ${styles.textMain}`}>{attachedSubject.name}</span>
                <button
                  onClick={() => setAttachedSubject(null)}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Input Row: Button | Textarea | Send Button */}
          <div className="flex gap-3 items-stretch">
            {/* Subject Picker Button */}
            <NeuIconButton
              onClick={() => setShowPicker(true)}
              variant="brand"
              className="shrink-0 flex items-center"
              title="Add Subject"
            >
              <Box size={20} className={attachedSubject ? 'text-brand' : ''} />
            </NeuIconButton>

            {/* Textarea with sparkle */}
            <div className="flex-1 relative flex items-center">
              <textarea
                className={`w-full rounded-xl px-4 py-2.5 pr-10 outline-none transition-all resize-none ${styles.bg} ${styles.shadowIn} ${styles.textMain} ${styles.inputPlaceholder} focus:ring-2 focus:ring-brand/20`}
                placeholder="Ask for an image or an ad copy..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <Sparkles size={14} className="absolute right-3 text-brand/40" />
            </div>

            {/* Send Button */}
            <NeuIconButton
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              variant="brand"
              className="shrink-0 flex items-center text-brand"
            >
              <Send size={20} />
            </NeuIconButton>
          </div>
        </div>
      </NeuCard>
    </div>
  );
};

export default ChatInterface;
