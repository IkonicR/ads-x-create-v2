
import React, { useState, useRef, useEffect } from 'react';
import { Business, ChatMessage } from '../types';
import { NeuCard, NeuButton, useThemeStyles } from '../components/NeuComponents';
import { Send, Bot, User, Sparkles, Paperclip, Download, Box, X } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { SubjectPicker } from '../components/SubjectPicker';

interface ChatInterfaceProps {
  business: Business;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ business }) => {
  const { styles, theme } = useThemeStyles();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [attachedSubject, setAttachedSubject] = useState<{ id: string; name: string; type: 'product' | 'person'; imageUrl?: string } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      text: `Hi! I'm your Creative Director for ${business.name}. It's ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}. Need ideas for upcoming holidays or a new product launch?`,
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 2. Check API Key via AI Studio
      // @ts-ignore
      if (typeof window !== 'undefined' && window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }

      // 3. Call API with History
      const historyForApi = messages.map(m => ({ role: m.role, text: m.text }));

      const aiResponse = await sendChatMessage(business, historyForApi, userMsg.text, attachedSubject || undefined);

      // Clear attachment after sending
      setAttachedSubject(null);

      // 4. Add AI Response (Text + Optional Image)
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: aiResponse.text,
        timestamp: new Date()
      };

      if (aiResponse.image) {
        aiMsg.attachment = {
          type: 'image',
          content: aiResponse.image
        };
      }

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: "Sorry, I had a creative block (API Error). Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
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
        <div className="flex gap-2">
          <NeuButton className="text-sm py-2" onClick={() => setMessages([messages[0]])}>Reset Chat</NeuButton>
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
        inset // Uses inner shadow for the container feel
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
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'ai'
                  ? `${styles.bg} ${styles.shadowOut} ${styles.textMain}`
                  : `${styles.bg} ${styles.shadowIn} ${styles.textMain} border-l-4 border-brand`
                  }`}>
                  {msg.text}
                </div>

                {/* Image Attachment (If Exists) */}
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
        <div className={`p-4 ${styles.bgAccent} border-t ${styles.border}`}>

          {attachedSubject && (
            <div className="flex items-center gap-2 mb-2 animate-fade-in">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${styles.bg} ${styles.shadowOut} border border-brand/20`}>
                <span className="text-xs font-bold text-brand uppercase">{attachedSubject.type}</span>
                <span className={`text-sm font-bold ${styles.textMain}`}>{attachedSubject.name}</span>
                <button
                  onClick={() => setAttachedSubject(null)}
                  className="ml-2 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4 items-end">
            <button
              onClick={() => setShowPicker(true)}
              className={`p-3 rounded-xl ${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-brand transition-colors mb-1 group`}
              title="Add Subject (Product or Team)"
            >
              <Box size={20} className={attachedSubject ? 'text-brand' : ''} />
            </button>
            <div className="flex-1 relative">
              <textarea
                className={`w-full rounded-xl px-4 py-3 pr-12 outline-none transition-all resize-none min-h-[50px] max-h-[120px] ${styles.bg} ${styles.shadowIn} ${styles.textMain} ${styles.inputPlaceholder} focus:ring-2 focus:ring-brand/20`}
                placeholder="Ask for an image or an ad copy..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="absolute right-3 bottom-3">
                <Sparkles size={16} className="text-brand opacity-50" />
              </div>
            </div>
            <NeuButton
              variant="primary"
              className="mb-1 h-[50px] w-[50px] flex items-center justify-center px-0"
              onClick={handleSend}
              disabled={loading}
            >
              <Send size={20} className="ml-1" />
            </NeuButton>
          </div>
        </div>
      </NeuCard>
    </div>
  );
};

export default ChatInterface;
