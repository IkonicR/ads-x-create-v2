import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Business, ChatMessage } from '../types';
import { CREDITS } from '../config/pricing';
import { NeuCard, NeuButton, NeuIconButton, useThemeStyles } from '../components/NeuComponents';
import { Send, Bot, User, Sparkles, Download, Box, X, History, Sliders } from 'lucide-react';
import { sendChatMessage, pollJobStatus, generateChatTitle } from '../services/geminiService';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { CreativeControls, CreativeContext } from '../components/CreativeControls';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { QuickActionPills, QuickEditInput } from '../components/QuickActionPills';
import { ChatHistoryPopover } from '../components/ChatHistoryPopover';
import { GeneratingIndicator } from '../components/GeneratingIndicator';
import * as chatService from '../services/chatService';
import { supabase } from '../services/supabase';
import { useJobs } from '../context/JobContext';
import { useSubscription } from '../context/SubscriptionContext';
import { ChatSession } from '../services/chatService';

// Strip internal context comments (e.g., <!-- campaignId: xxx -->) from display
const stripInternalComments = (text: string): string => {
  return text
    .replace(/<!--\s*campaignId:\s*[^>]+-->/gi, '')
    .replace(/\n{3,}/g, '\n\n') // Clean up excess newlines
    .trim();
};

interface ChatInterfaceProps {
  business: Business;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ business }) => {
  const { styles } = useThemeStyles();
  const { jobs, addJob, removeJob, updateJob } = useJobs();
  const { deductCredits, refundCredits } = useSubscription();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [creativeContext, setCreativeContext] = useState<CreativeContext>({
    subject: null,
    isFreedomMode: false,
    overrides: {}
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [pendingJobIds, setPendingJobIds] = useState<string[]>([]);  // Phase 5: Multiple jobs
  const [recentGeneratedImage, setRecentGeneratedImage] = useState<string | null>(null);  // Phase 6: For AI vision
  const [editMode, setEditMode] = useState<string | null>(null); // Phase 8: Inline editing
  const [resizeMode, setResizeMode] = useState<string | null>(null); // Phase 8: Resize interactions
  const [showHistory, setShowHistory] = useState(false);  // History popover
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [generationMeta, setGenerationMeta] = useState<{
    total: number;
    aspectRatio?: string;
    styleName?: string;
  } | null>(null);  // Generation feedback metadata
  const [sendCooldown, setSendCooldown] = useState(false); // Rate limiting: 2s cooldown
  
  // Campaign progress tracking: show inline progress as images generate
  const [activeCampaign, setActiveCampaign] = useState<{
    id: string;
    totalImages: number;
    completedImages: number;
    assetUrls: string[];
    aspectRatio?: string;  // Track aspect ratio for proper display
  } | null>(null);

  // Track which job IDs we've already processed to prevent duplicate saves
  const processedJobIds = useRef<Set<string>>(new Set());
  
  // Ref to track loading state for Realtime subscription (avoids re-subscription on loading change)
  const loadingRef = useRef(false);

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
        attachments: m.attachments
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
        attachments: m.attachments
      })),
      lastSyncedAt: new Date().toISOString()
    });
  }, [business.id]);

  // Background sync with database (non-blocking)
  useEffect(() => {
    const syncWithDatabase = async () => {
      try {
        // Priority order for session ID:
        // 1. Cache's sessionId (what we just rendered)
        // 2. localStorage (explicit user selection)
        // 3. Most recent from database
        const cached = chatService.getCachedChat(business.id);
        const storageKey = `chat_session_${business.id}`;
        const savedSessionId = localStorage.getItem(storageKey);

        console.log('[ChatInterface] Session priority check:', {
          cachedSessionId: cached?.sessionId,
          localStorageSessionId: savedSessionId,
        });

        let sessionIdToLoad = cached?.sessionId || savedSessionId || null;
        let session = null;

        if (sessionIdToLoad) {
          // Try to load the cached/saved session
          session = await chatService.getSessionById(sessionIdToLoad);
          console.log('[ChatInterface] Loaded preferred session:', session?.id);
        }

        // Fall back to most recent if session not found
        if (!session) {
          session = await chatService.findActiveSession(business.id);
          console.log('[ChatInterface] Fell back to most recent session:', session?.id);
        }

        if (!session) return; // No session yet - will create on first message

        // CRITICAL: If session matches what we already have from cache, skip reload
        if (cached?.sessionId === session.id && cached.messages.length > 0) {
          console.log('[ChatInterface] ✅ Session matches cache - keeping current messages');
          setSessionId(session.id);
          localStorage.setItem(storageKey, session.id);
          return; // Don't overwrite!
        }

        console.log('[ChatInterface] Loading messages for session:', session.id);
        setSessionId(session.id);
        // Persist to localStorage for future
        localStorage.setItem(storageKey, session.id);

        // Always load from database - it's the source of truth for attachments
        // Cache is only an optimization layer for initial render
        const dbMessages = await chatService.loadMessages(session.id);

        if (dbMessages.length > 0) {
          // Hydrate attachments for each message
          const loadedMessages: ChatMessage[] = await Promise.all(
            dbMessages.map(async m => {
              const attachments = await chatService.getAttachments(m.id);
              return {
                id: m.id,
                role: m.role,
                text: m.content,
                timestamp: new Date(m.created_at),
                attachments: attachments.length > 0
                  ? attachments.map(a => ({ type: 'image' as const, content: a.url }))
                  : undefined
              };
            })
          );
          setMessages(loadedMessages);
          updateCache(loadedMessages, session.id);
        } else {
          // New session - save welcome message
          const welcome = getWelcomeMessage();
          await chatService.saveMessage(session.id, 'ai', welcome.text, undefined, undefined, business.id);
          updateCache([welcome], session.id);
        }
      } catch (error) {
        console.error('[ChatInterface] Background sync failed:', error);
      }
    };

    syncWithDatabase();
  }, [business.id, getWelcomeMessage, updateCache]);

  // Supabase Realtime: Cross-device sync (filtered to THIS session only)
  useEffect(() => {
    if (!sessionId) return;

    // CRITICAL: Don't reload on initial mount if cache already has the right data
    const cached = chatService.getCachedChat(business.id);
    const skipInitialReload = cached?.sessionId === sessionId && cached.messages.length > 0;

    let isLoading = false;  // Guard against concurrent reloads
    let debounceTimer: NodeJS.Timeout | null = null;
    let hasRunOnce = false;  // Track if we've already loaded once

    const reloadMessages = async () => {
      if (isLoading) return;  // Prevent concurrent loads
      
      // CRITICAL: Skip reload while we're actively sending a message
      // This prevents duplicate messages from Realtime triggering reload
      if (loadingRef.current) {
        console.log('[ChatInterface] ⏭️ Skipping reload - message send in progress');
        return;
      }

      // Skip first run if cache already has the data
      if (!hasRunOnce && skipInitialReload) {
        console.log('[ChatInterface] ⏭️ Skipping initial reload - cache already has correct session');
        hasRunOnce = true;
        return;
      }
      hasRunOnce = true;
      isLoading = true;

      try {
        const dbMessages = await chatService.loadMessages(sessionId);
        if (dbMessages.length > 0) {
          const loadedMessages: ChatMessage[] = await Promise.all(
            dbMessages.map(async m => {
              const attachments = await chatService.getAttachments(m.id);
              return {
                id: m.id,
                role: m.role,
                text: m.content,
                timestamp: new Date(m.created_at),
                attachments: attachments.length > 0
                  ? attachments.map(a => ({ type: 'image' as const, content: a.url }))
                  : undefined
              };
            })
          );
          setMessages(loadedMessages);
          updateCache(loadedMessages, sessionId);
        }
      } finally {
        isLoading = false;
      }
    };

    // Debounced reload to prevent rapid-fire updates
    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(reloadMessages, 300);  // 300ms debounce
    };

    const channel = supabase
      .channel(`chat-sync-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`  // CRITICAL: Filter to THIS session only
        },
        debouncedReload
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_attachments'
          // Note: chat_attachments doesn't have session_id, but it's linked to messages
          // We'll debounce to prevent loops
        },
        debouncedReload
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [sessionId, updateCache]);

  // NOTE: BroadcastChannel removed - Supabase Realtime handles cross-device sync

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

          // Get job metadata for persistence
          const job = jobs.find(j => j.id === jobId);
          const attachmentMetadata = {
            prompt: job?.prompt,
            aspectRatio: job?.aspectRatio,
            styleName: job?.styleName,
            styleId: job?.styleId,
            modelTier: job?.modelTier,
            subjectId: job?.subjectId,
          };

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

            // Persist to new chat_attachments table with metadata
            chatService.saveAttachment(messageId, business.id, status.asset.content, attachmentMetadata);

            // Remove this job from pending
            setPendingJobIds(prev => prev.filter(id => id !== jobId));
            removeJob(jobId);
          } else {
            setMessages(prev => prev.map(m =>
              m.id === messageId
                ? {
                  ...m,
                  attachments: [{ type: 'image' as const, content: status.asset.content }],
                  imageUrl: status.asset.content  // Phase 6: Store for AI vision
                }
                : m
            ));
            setPendingJobId(null);
            setGenerationMeta(null);

            // Persist to new chat_attachments table with metadata
            chatService.saveAttachment(messageId, business.id, status.asset.content, attachmentMetadata);
            removeJob(jobId);
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

  // Campaign progress polling: fetch status and update inline progress display
  const pollCampaignProgress = useCallback(async (campaignId: string) => {
    console.log('[ChatInterface] 🎬 Starting campaign progress poll:', campaignId);
    
    const poll = async () => {
      try {
        const res = await fetch(`/api/generate-campaign/status/${campaignId}`);
        if (!res.ok) {
          console.error('[ChatInterface] Campaign status fetch failed:', res.status);
          return;
        }
        
        const data = await res.json();
        console.log('[ChatInterface] 📊 Campaign status:', {
          completed: data.completedImages,
          total: data.totalImages,
          status: data.status
        });
        
        setActiveCampaign({
          id: campaignId,
          totalImages: data.totalImages,
          completedImages: data.completedImages,
          assetUrls: data.assetUrls || [],
          aspectRatio: data.aspectRatio || '1:1'  // Track aspect ratio for proper display
        });
        
        // Keep polling until complete (status becomes 'completed' when all images done)
        if (data.status !== 'completed' && data.completedImages < data.totalImages) {
          setTimeout(poll, 2000);  // Poll every 2s
        } else {
          console.log('[ChatInterface] ✅ Campaign complete!', campaignId);
          // Keep the campaign visible for 15 seconds so user can see completion
          setTimeout(() => setActiveCampaign(null), 15000);
        }
      } catch (err) {
        console.error('[ChatInterface] Campaign poll error:', err);
      }
    };
    
    poll();
  }, []);

  // Sync pendingJobId/pendingJobIds state from JobContext
  // JobContext handles polling; we just need to track which jobs are ours
  useEffect(() => {
    const chatJobs = jobs.filter(j => j.type === 'chat' && j.businessId === business.id);
    
    // DEBUG: Log job filtering for troubleshooting
    console.log('[ChatInterface] 🔍 Job sync effect:', {
      totalJobs: jobs.length,
      chatJobsForBusiness: chatJobs.length,
      chatJobs: chatJobs.map(j => ({ id: j.id, type: j.type, status: j.status, result: !!j.result }))
    });

    if (chatJobs.length === 0) {
      // No pending chat jobs
      if (pendingJobId || pendingJobIds.length > 0) {
        setPendingJobId(null);
        setPendingJobIds([]);
        setGenerationMeta(null);
      }
      return;
    }

    // UNIFIED PATH: Handle all jobs the same way (1, 3, or 100 images)
    const pendingJobs = chatJobs.filter(j => j.status === 'polling');
    const completedJobs = chatJobs.filter(j => j.status === 'complete' && j.result);
    const failedJobs = chatJobs.filter(j => j.status === 'failed');
    
    console.log('[ChatInterface] 📊 Job breakdown:', {
      pending: pendingJobs.length,
      completed: completedJobs.length,
      failed: failedJobs.length
    });


    // Handle failed jobs - show error message, refund credits, and remove
    if (failedJobs.length > 0) {
      for (const job of failedJobs) {
        // Refund credit for failed generation (uses costStandard - chat uses pro by default)
        refundCredits(CREDITS.costStandard);
        console.log(`[ChatInterface] 💰 Refunded ${CREDITS.costStandard} credits for failed job: ${job.id}`);

        // Add error message to chat
        const errorMsg: ChatMessage = {
          id: `error-${job.id}`,
          role: 'ai',
          text: `⚠️ Image generation failed: ${job.errorMessage || 'The AI model is overloaded. Please try again in a moment.'} (Credit refunded)`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
        removeJob(job.id);
      }
    }

    // Handle completed jobs with batch fix
    if (completedJobs.length > 0) {
      // Filter out jobs we've already processed to prevent duplicate saves
      const unprocessedJobs = completedJobs.filter(j => !processedJobIds.current.has(j.id));
      if (unprocessedJobs.length === 0) {
        // All jobs already processed, just remove them
        for (const job of completedJobs) {
          removeJob(job.id);
        }
        return;
      }

      // Step 1: Group attachments by messageId
      const newAttachmentsByMessage: Record<string, Array<{ type: 'image', content: string }>> = {};
      for (const job of unprocessedJobs) {
        if (job.messageId && job.result) {
          if (!newAttachmentsByMessage[job.messageId]) {
            newAttachmentsByMessage[job.messageId] = [];
          }
          newAttachmentsByMessage[job.messageId].push({ type: 'image', content: job.result });
        }
      }

      // Step 2: Apply ALL attachments in a single state update
      if (Object.keys(newAttachmentsByMessage).length > 0) {
        setMessages(prev => prev.map(m => {
          const newAttachments = newAttachmentsByMessage[m.id];
          if (!newAttachments) return m;

          const existing = m.attachments || [];
          return {
            ...m,
            attachments: [...existing, ...newAttachments],
            imageUrl: newAttachments[newAttachments.length - 1].content
          };
        }));
      }

      // Step 2.5: PERSIST to database (critical for refresh survival)
      for (const job of unprocessedJobs) {
        if (job.messageId && job.result) {
          // Mark as processed BEFORE async save to prevent race conditions
          processedJobIds.current.add(job.id);
          chatService.saveAttachment(job.messageId, business.id, job.result, {
            prompt: job.prompt,
            aspectRatio: job.aspectRatio,
            styleName: job.styleName,
            styleId: job.styleId,
            modelTier: job.modelTier,
          });
        }
      }

      // Step 3: Remove all completed jobs AFTER state update
      for (const job of unprocessedJobs) {
        removeJob(job.id);
      }
    }

    // Handle pending jobs
    if (pendingJobs.length > 0) {
      setPendingJobIds(pendingJobs.map(j => j.id));
      setGenerationMeta({
        total: pendingJobs.length,
        aspectRatio: pendingJobs[0]?.aspectRatio,
        styleName: pendingJobs[0]?.styleName
      });
    } else {
      setPendingJobIds([]);
      setGenerationMeta(null);
    }
  }, [jobs, business.id, removeJob]);

  const handleSend = async (overrideText?: string) => {
    const userText = overrideText || input.trim();
    if (!userText || loading || sendCooldown) return; // Rate limit check

    setInput('');
    setLoading(true);
    loadingRef.current = true;  // Sync ref for Realtime subscription
    setSendCooldown(true); // Start cooldown
    setTimeout(() => setSendCooldown(false), 2000); // Reset after 2s
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
          // Persist to localStorage for session persistence on refresh
          localStorage.setItem(`chat_session_${business.id}`, newSession.id);
          // Save welcome message too
          await chatService.saveMessage(newSession.id, 'ai', getWelcomeMessage().text, undefined, undefined, business.id);
        }
      }

      // Save user message to DB
      if (currentSessionId) {
        const savedUserMsg = await chatService.saveMessage(currentSessionId, 'user', userText, undefined, undefined, business.id);
        if (savedUserMsg) {
          setMessages(prev => prev.map(m =>
            m.id === userMsg.id ? { ...m, id: savedUserMsg.id } : m
          ));
        }

        // Dynamic Title Refinement: Generate/refine at 1st, 3rd, and 5th messages
        const userMessageCount = messages.filter(m => m.role === 'user').length;

        // Message 1: Initial title
        if (userMessageCount === 0) {
          generateChatTitle(userText).then(title => {
            chatService.updateSessionTitle(currentSessionId!, title);
          });
        }

        // Message 3: First refinement (more context)
        if (userMessageCount === 2) {
          const recentMessages = [...messages.slice(-4).map(m => m.text), userText];
          generateChatTitle(recentMessages).then(title => {
            chatService.updateSessionTitle(currentSessionId!, title);
          });
        }

        // Message 5: Final refinement (maximum context)
        if (userMessageCount === 4) {
          const recentMessages = [...messages.slice(-6).map(m => m.text), userText];
          generateChatTitle(recentMessages).then(title => {
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
      const aiResponse = await sendChatMessage(business, historyForApi, userText, creativeContext, recentGeneratedImage || undefined);

      // Clear subject after sending (keep other context)
      setCreativeContext(prev => ({ ...prev, subject: null }));

      // Create AI message
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'ai',
        text: aiResponse.text,
        timestamp: new Date(),
        attachments: aiResponse.image ? [{ type: 'image', content: aiResponse.image }] : undefined
      };

      // Save AI response to DB - CRITICAL: We need the database ID for attachment persistence
      // Use currentSessionId (not sessionId state) since state may not have updated yet
      let dbMessageId: string | undefined;
      if (currentSessionId) {
        const savedAiMsg = await chatService.saveMessage(
          currentSessionId,
          'ai',
          aiResponse.text,
          aiResponse.image ? 'image' : undefined,
          aiResponse.image,
          business.id
        );
        if (savedAiMsg) {
          aiMsg.id = savedAiMsg.id;
          dbMessageId = savedAiMsg.id;
        }
      }

      setMessages(prev => {
        const updated = [...prev, aiMsg];
        updateCache(updated, currentSessionId);
        return updated;
      });

      // Phase 3/5: Start polling if AI triggered image generation
      // CRITICAL: Only register jobs if we have a valid database messageId for attachment persistence
      const effectiveMessageId = dbMessageId || aiMsg.id;
      const isValidUuid = dbMessageId && !dbMessageId.startsWith('ai-');

      if (!isValidUuid && (aiResponse.jobId || aiResponse.jobIds?.length)) {
        console.warn('[ChatInterface] ⚠️ Message save failed - attachments may not persist. MessageId:', effectiveMessageId);
      }

      // CRITICAL FIX: Save direct image responses (like preview_campaign_anchor) to chat_attachments
      // This prevents race condition where realtime reloadMessages() wipes out in-memory attachments
      if (aiResponse.image && isValidUuid && !aiResponse.jobId && !aiResponse.jobIds?.length) {
        console.log('[ChatInterface] 💾 Saving direct image attachment:', aiResponse.image.substring(0, 80) + '...');
        chatService.saveAttachment(dbMessageId!, business.id, aiResponse.image, {
          aspectRatio: aiResponse.generationMeta?.aspectRatio,
          styleName: aiResponse.generationMeta?.styleName,
        });
      }

      // CRITICAL: Deduct credits for chat-triggered image generations
      // costStandard credits per image (chat uses pro by default)
      const jobCount = aiResponse.jobIds?.length || (aiResponse.jobId ? 1 : 0);
      if (jobCount > 0) {
        const creditCost = jobCount * CREDITS.costStandard;
        const success = await deductCredits(creditCost);
        if (!success) {
          console.error('[ChatInterface] ⚠️ Failed to deduct credits for', jobCount, 'jobs');
          // Continue anyway - jobs are already submitted server-side
        } else {
          console.log(`[ChatInterface] 💳 Deducted ${creditCost} credits for ${jobCount} image(s)`);
        }
      }

      if (aiResponse.jobId) {
        // Single image generation - register with JobContext
        addJob({
          id: aiResponse.jobId,
          type: 'chat',
          businessId: business.id,
          messageId: effectiveMessageId,
          aspectRatio: aiResponse.generationMeta?.aspectRatio || '1:1',
          styleName: aiResponse.generationMeta?.styleName,
          createdAt: Date.now()
        });
        setPendingJobId(aiResponse.jobId);
        setGenerationMeta(aiResponse.generationMeta || { total: 1 });
      } else if (aiResponse.jobIds && aiResponse.jobIds.length > 0) {
        // Phase 5: Batch generation - register each with JobContext
        for (const jobId of aiResponse.jobIds) {
          addJob({
            id: jobId,
            type: 'chat',
            businessId: business.id,
            messageId: effectiveMessageId,
            aspectRatio: aiResponse.generationMeta?.aspectRatio || '1:1',
            styleName: aiResponse.generationMeta?.styleName,
            createdAt: Date.now()
          });
        }
        setPendingJobIds(aiResponse.jobIds);
        setGenerationMeta(aiResponse.generationMeta || { total: aiResponse.jobIds.length });
      }

      // Campaign progress: Start polling if continue_campaign was called
      // Only trigger when campaignGenerating is true (not on preview_campaign_anchor)
      if (aiResponse.campaignId && aiResponse.campaignGenerating) {
        console.log('[ChatInterface] 🎬 Campaign generating, starting progress poll:', aiResponse.campaignId);
        pollCampaignProgress(aiResponse.campaignId);
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
      loadingRef.current = false;  // Sync ref for Realtime subscription
    }
  };

  const handleReset = async () => {
    // Clear cache and localStorage - we're starting fresh
    chatService.clearCachedChat(business.id);
    localStorage.removeItem(`chat_session_${business.id}`);

    // Reset to welcome message (UI only - no DB session yet)
    const welcome = getWelcomeMessage();
    setMessages([welcome]);
    setSessionId(null); // No session until first message

    // Deactivate any existing session in background (don't create new one)
    await chatService.deactivateAllSessions(business.id);
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

    // Hydrate attachments for each message
    const loadedMessages = await Promise.all(
      messages.map(async m => {
        const attachments = await chatService.getAttachments(m.id);
        return {
          id: m.id,
          role: m.role,
          text: m.content,
          timestamp: new Date(m.created_at),
          attachments: attachments.length > 0
            ? attachments.map(a => ({ type: 'image' as const, content: a.url }))
            : undefined
        };
      })
    );

    setMessages(loadedMessages);
    setSessionId(session.id);
    // Persist this as the current session
    localStorage.setItem(`chat_session_${business.id}`, session.id);
    updateCache(loadedMessages, session.id);
  };

  // New chat from history popover
  const handleNewChat = async () => {
    setShowHistory(false);
    await handleReset();
  };

  // Delete session
  const handleDeleteSession = async (sid: string) => {
    const success = await chatService.deleteSession(sid);
    if (success) {
      // Refresh list
      await loadAllSessions();
      // If deleting active session, reset
      if (sessionId === sid) {
        await handleReset();
      }
    }
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
              onDelete={handleDeleteSession}
              onClose={() => setShowHistory(false)}
            />
          )}
        </div>
      </header>

      {showControls && (
        <CreativeControls
          business={business}
          currentContext={creativeContext}
          onApply={(ctx) => setCreativeContext(ctx)}
          onClose={() => setShowControls(false)}
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
                <div className={`p-4 rounded-2xl text-base leading-relaxed ${msg.role === 'ai'
                  ? `${styles.bg} ${styles.shadowOut} ${styles.textMain}`
                  : `${styles.bg} ${styles.shadowIn} ${styles.textMain} border-l-4 border-brand whitespace-pre-wrap`
                  }`}>
                  {msg.role === 'ai' ? (
                    <MarkdownRenderer content={stripInternalComments(msg.text)} />
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Image Attachment - only show if no batch attachments */}
                {msg.attachment && msg.attachment.type === 'image' && (!msg.attachments || msg.attachments.length === 0) && (
                  <div className={`mt-4 rounded-2xl overflow-hidden p-3 ${styles.bg} ${styles.shadowOut} animate-fade-in max-w-sm group`}>
                    <div className="relative">
                      <img src={msg.attachment.content} alt="Generated" className="w-full h-auto rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <button className="bg-white text-black p-2 rounded-full font-bold flex items-center gap-2 text-xs">
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                    <div className={`mt-2 px-1 flex justify-between items-center ${styles.textSub} text-xs`}>
                      <span className="font-bold">AI GENERATED</span>
                      <Sparkles size={12} className="text-brand" />
                    </div>

                    {/* Action Pills (always visible) */}
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <QuickActionPills
                        isEditMode={editMode === msg.id}
                        onVariations={() => {
                          setRecentGeneratedImage(msg.attachment!.content);
                          setInput("Generate 3 variations of this image");
                        }}
                        onEdit={() => setEditMode(editMode === msg.id ? null : msg.id)}
                        onDifferentStyle={() => {
                          setRecentGeneratedImage(msg.attachment!.content);
                          setInput("Try a different style: ");
                        }}
                        onResize={() => {
                          setRecentGeneratedImage(msg.attachment!.content);
                          setInput("Resize this to: ");
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

                {/* Phase 5: Multiple Image Attachments (Responsive Grid) */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
                    {msg.attachments.map((att, i) => (
                      <div key={i} className={`rounded-2xl overflow-hidden p-3 ${styles.bg} ${styles.shadowOut} animate-fade-in group`}>
                        <div className="relative">
                          <img src={att.content} alt={`Generated ${i + 1}`} className="w-full h-auto rounded-xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <button className="bg-white text-black p-2 rounded-full font-bold flex items-center gap-2 text-xs">
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                        <div className={`mt-2 px-1 flex justify-between items-center ${styles.textSub} text-xs`}>
                          <span className="font-bold">AI GENERATED #{i + 1}</span>
                          <Sparkles size={10} className="text-brand" />
                        </div>

                        {/* Action Pills (always visible) */}
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <QuickActionPills
                            isEditMode={editMode === `${msg.id}-${i}`}
                            onVariations={() => {
                              setRecentGeneratedImage(att.content);
                              setInput(`Generate 3 variations of image #${i + 1}`);
                            }}
                            onEdit={() => setEditMode(editMode === `${msg.id}-${i}` ? null : `${msg.id}-${i}`)}
                            onDifferentStyle={() => {
                              setRecentGeneratedImage(att.content);
                              setInput(`Try a different style for image #${i + 1}: `);
                            }}
                            onResize={() => {
                              setRecentGeneratedImage(att.content);
                              setInput(`Resize image #${i + 1} to: `);
                            }}
                            onSave={() => {
                              console.log("Save clicked for image", i + 1);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          ))}

          {/* Generation Status Bubble - separate from AI messages */}
          {(pendingJobId || pendingJobIds.length > 0) && generationMeta && (
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-brand/10 text-brand`}>
                <Sparkles size={20} />
              </div>
              <div className={`p-4 rounded-2xl ${styles.bg} ${styles.shadowOut}`}>
                <GeneratingIndicator
                  total={generationMeta.total}
                  aspectRatio={generationMeta.aspectRatio}
                  styleName={generationMeta.styleName}
                />
              </div>
            </div>
          )}

          {loading && (
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${styles.bg} ${styles.shadowOut} text-brand`}>
                <Bot size={20} />
              </div>
              <div className={`p-4 rounded-2xl ${styles.bg} ${styles.shadowOut} text-base`}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Campaign Progress Card: Shows inline progress as images generate */}
          {activeCampaign && (
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${styles.bg} ${styles.shadowOut} text-brand`}>
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <NeuCard className="flex-1">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-brand">
                      🎬 Generating Campaign...
                    </span>
                    <span className={`text-sm ${styles.muted}`}>
                      {activeCampaign.completedImages}/{activeCampaign.totalImages}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className={`h-2 rounded-full ${styles.bg} ${styles.shadowIn} mb-4 overflow-hidden`}>
                    <div 
                      className="h-full bg-linear-to-r from-brand to-accent transition-all duration-500"
                      style={{ width: `${(activeCampaign.completedImages / Math.max(activeCampaign.totalImages, 1)) * 100}%` }}
                    />
                  </div>
                  {/* Image grid - dynamic aspect ratio based on campaign */}
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: activeCampaign.totalImages }).map((_, i) => {
                      // Dynamic aspect ratio class based on campaign setting
                      const getAspectClass = (ratio?: string) => {
                        switch (ratio) {
                          case '9:16': return 'aspect-[9/16]';
                          case '16:9': return 'aspect-[16/9]';
                          case '4:5': return 'aspect-[4/5]';
                          case '5:4': return 'aspect-[5/4]';
                          case '2:3': return 'aspect-[2/3]';
                          case '3:2': return 'aspect-[3/2]';
                          case '3:4': return 'aspect-[3/4]';
                          case '4:3': return 'aspect-[4/3]';
                          case '21:9': return 'aspect-[21/9]';
                          default: return 'aspect-square';
                        }
                      };
                      
                      return (
                        <div key={i} className={`${getAspectClass(activeCampaign.aspectRatio)} rounded-lg overflow-hidden ${styles.bg} ${styles.shadowIn}`}>
                          {activeCampaign.assetUrls[i] ? (
                            <img 
                              src={activeCampaign.assetUrls[i]} 
                              alt={`Campaign image ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {activeCampaign.completedImages === activeCampaign.totalImages && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-brand font-medium">✅ Campaign complete!</span>
                      <button 
                        onClick={() => setActiveCampaign(null)}
                        className={`text-sm ${styles.muted} hover:text-brand transition-colors`}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </NeuCard>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4">
          {/* Attached Subject Pill */}
          {creativeContext.subject && (
            <div className="flex items-center gap-2 mb-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${styles.bg} ${styles.shadowOut} border border-brand/20`}>
                <span className="text-xs font-bold text-brand uppercase">{creativeContext.subject.type}</span>
                <span className={`text-sm font-bold ${styles.textMain}`}>{creativeContext.subject.name}</span>
                <button
                  onClick={() => setCreativeContext(prev => ({ ...prev, subject: null }))}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Freedom Mode Badge */}
              {creativeContext.isFreedomMode && (
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand/10 text-brand text-xs font-bold`}>
                  <Sparkles size={12} />
                  Freedom
                </div>
              )}
            </div>
          )}

          {/* Freedom Mode Badge (when no subject) */}
          {!creativeContext.subject && creativeContext.isFreedomMode && (
            <div className="flex items-center gap-2 mb-3">
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand/10 text-brand text-xs font-bold`}>
                <Sparkles size={12} />
                Freedom Mode
              </div>
            </div>
          )}

          {/* Input Row: Button | Textarea | Send Button */}
          <div className="flex gap-3 items-stretch">
            {/* Creative Controls Button */}
            <NeuIconButton
              onClick={() => setShowControls(true)}
              variant="brand"
              className="shrink-0 flex items-center"
              title="Creative Controls"
            >
              <Sliders size={20} className={creativeContext.subject || creativeContext.isFreedomMode ? 'text-brand' : ''} />
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
      </NeuCard >
    </div >
  );
};

export default ChatInterface;
