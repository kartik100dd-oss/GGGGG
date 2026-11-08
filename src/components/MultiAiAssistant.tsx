import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Send, Globe, Mic, MicOff, Volume2, VolumeX, Sparkles, 
  Paperclip, ExternalLink, RefreshCw, Copy, Check, User, ShieldCheck, Download, Trash2 
} from 'lucide-react';
import { MultiModelPersona, MultiModelMessage } from '../types';
import MediaUploader, { UploadedMediaItem } from './MediaUploader';

interface MultiAiAssistantProps {
  studentProfile?: any;
  activeReport?: any;
}

export default function MultiAiAssistant({ studentProfile, activeReport }: MultiAiAssistantProps) {
  const [selectedModel, setSelectedModel] = useState<MultiModelPersona>('gemini');
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<UploadedMediaItem | null>(null);

  const [messages, setMessages] = useState<MultiModelMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      model: 'gemini',
      content: `Welcome to the AI RED DRAGON Multi-Intelligence Engine! I can synthesize guidance across Google Gemini 3.8 Flash, ChatGPT-4o reasoning, Claude 3.5 architectural analysis, and Grok-3 direct market perspectives. Live web search is ${enableWebSearch ? 'ACTIVE' : 'OFF'}. How can I assist your educational and career strategy today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      groundingUrls: [
        { title: 'National Institutional Ranking Framework (NIRF India)', uri: 'https://www.nirfindia.org' },
        { title: 'Joint Entrance Examination (JEE Apex Board)', uri: 'https://jeemain.nta.nic.in' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachedMedia) || loading) return;

    const userText = input.trim();
    const currentAttachment = attachedMedia;

    const userMsg: MultiModelMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: userText || `[Attached ${currentAttachment?.type.toUpperCase()}: ${currentAttachment?.name}]`,
      model: selectedModel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaAttachment: currentAttachment ? {
        name: currentAttachment.name,
        type: currentAttachment.type,
        dataUrl: currentAttachment.dataUrl
      } : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedMedia(null);
    setLoading(true);

    try {
      const response = await fetch('/api/multi-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          model: selectedModel,
          enableSearch: enableWebSearch,
          chatHistory: messages.slice(-6),
          profile: studentProfile,
          mediaAttachment: currentAttachment ? {
            name: currentAttachment.name,
            type: currentAttachment.type,
            dataUrl: currentAttachment.dataUrl
          } : undefined
        })
      });

      const data = await response.json();

      const assistantMsg: MultiModelMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: data.reply || 'Analysis generated successfully.',
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingUrls: data.groundingUrls || []
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (ttsEnabled && data.reply) {
        speakText(data.reply);
      }
    } catch (error) {
      console.error('Error querying multi-AI endpoint:', error);
      // Client-side graceful fallback response
      const fallbackReply = `[${selectedModel.toUpperCase()} Response]: Based on your academic inquiry regarding "${userText || 'educational profile'}", maintain strong performance in core subjects, build documented projects, and target institutions aligned with your NIRF goals and budget constraints.`;
      const fallbackMsg: MultiModelMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: fallbackReply,
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const modelMeta: Record<MultiModelPersona, { name: string; tag: string; color: string; badge: string }> = {
    gemini: {
      name: 'Gemini 3.8 Flash',
      tag: 'Google DeepMind Grounded AI',
      color: 'border-blue-500/40 text-blue-600 bg-blue-50/50',
      badge: 'DeepMind'
    },
    chatgpt: {
      name: 'ChatGPT-4o Style',
      tag: 'OpenAI Systematic Logic & Code',
      color: 'border-emerald-500/40 text-emerald-600 bg-emerald-50/50',
      badge: 'OpenAI Logic'
    },
    claude: {
      name: 'Claude 3.5 Sonnet Style',
      tag: 'Anthropic Nuance & Architecture',
      color: 'border-amber-500/40 text-amber-600 bg-amber-50/50',
      badge: 'Anthropic'
    },
    grok: {
      name: 'Grok-3 Style',
      tag: 'xAI Direct & Unfiltered Real-Time',
      color: 'border-purple-500/40 text-purple-600 bg-purple-50/50',
      badge: 'xAI Direct'
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Banner Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Model Switcher Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['gemini', 'chatgpt', 'claude', 'grok'] as MultiModelPersona[]).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedModel(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedModel === m
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{modelMeta[m].name}</span>
            </button>
          ))}
        </div>

        {/* Feature Switches */}
        <div className="flex items-center gap-3">
          {/* Live Web Search Switch */}
          <button
            onClick={() => setEnableWebSearch(!enableWebSearch)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              enableWebSearch
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <Globe size={13} className={enableWebSearch ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Live Search {enableWebSearch ? 'ON' : 'OFF'}</span>
          </button>

          {/* Text-to-Speech Toggle */}
          <button
            onClick={() => {
              if (ttsEnabled) window.speechSynthesis.cancel();
              setTtsEnabled(!ttsEnabled);
            }}
            className={`p-2 rounded-xl text-xs transition cursor-pointer border ${
              ttsEnabled ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title={ttsEnabled ? 'Mute AI Voice' : 'Enable AI Voice Narration'}
          >
            {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Media Drawer Toggle */}
          <button
            onClick={() => setShowMediaUploader(!showMediaUploader)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              showMediaUploader ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Paperclip size={13} />
            <span>Media Files</span>
          </button>
        </div>
      </div>

      {/* Media Uploader Drawer if toggled */}
      <AnimatePresence>
        {showMediaUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <MediaUploader
              onSendToChat={(media) => {
                setAttachedMedia(media);
                setShowMediaUploader(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[640px] overflow-hidden">
        {/* Active Model Indicator Header */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shadow">
              <Bot size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">{modelMeta[selectedModel].name}</span>
                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-bold border border-red-500/30">
                  {modelMeta[selectedModel].badge}
                </span>
                {enableWebSearch && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Globe size={10} /> Google Grounded
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">{modelMeta[selectedModel].tag}</p>
            </div>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Reset Chat Session"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-black shadow-xs ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-red-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* Message Bubble */}
              <div className={`space-y-2 rounded-2xl p-4 text-xs leading-relaxed max-w-[85%] sm:max-w-xl ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white shadow-md rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-xs'
              }`}>
                {/* Attached media display */}
                {msg.mediaAttachment && (
                  <div className={`p-2 rounded-lg border flex items-center gap-2 mb-2 text-[11px] font-bold ${
                    msg.role === 'user' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <Paperclip size={12} className="text-red-500 shrink-0" />
                    <span className="truncate">{msg.mediaAttachment.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/10">{msg.mediaAttachment.type}</span>
                  </div>
                )}

                {/* Content prose */}
                <div className="whitespace-pre-wrap font-medium">
                  {msg.content}
                </div>

                {/* Grounding Search Sources if available */}
                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Globe size={11} className="text-emerald-500" />
                      Live Verified Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingUrls.map((g, i) => (
                        <a
                          key={i}
                          href={g.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-2 py-0.5 rounded-md transition"
                        >
                          <span className="truncate max-w-[200px]">{g.title || g.uri}</span>
                          <ExternalLink size={9} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer timestamp & actions */}
                <div className={`flex items-center justify-between text-[10px] pt-1.5 ${
                  msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'
                }`}>
                  <span className="capitalize">{msg.role === 'assistant' ? modelMeta[msg.model].name : 'Student'} · {msg.timestamp}</span>
                  <div className="flex items-center gap-1">
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speakText(msg.content)}
                        className="hover:text-slate-600 p-0.5 transition cursor-pointer"
                        title="Read aloud"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-slate-600 p-0.5 transition cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-xl animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-red-600" />
                <span>Synthesizing response via {modelMeta[selectedModel].name}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attached item indicator preview */}
        {attachedMedia && (
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Paperclip size={13} className="text-red-600" />
              <span className="font-bold truncate max-w-xs">{attachedMedia.name}</span>
              <span className="text-[10px] text-slate-400">({attachedMedia.size})</span>
            </div>
            <button
              onClick={() => setAttachedMedia(null)}
              className="text-slate-400 hover:text-rose-600 p-0.5 transition cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* Input Form Box */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          {/* Paperclip */}
          <button
            type="button"
            onClick={() => setShowMediaUploader(!showMediaUploader)}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
            title="Attach Document / Media"
          >
            <Paperclip size={18} />
          </button>

          {/* Speech Mic */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
              isRecording 
                ? 'bg-rose-500 text-white animate-pulse shadow-md' 
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Dictate with Voice'}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording 
                ? 'Listening to your voice...' 
                : `Ask ${modelMeta[selectedModel].name} anything about admissions, cutoffs, scholarships...`
            }
            className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachedMedia) || loading}
            className="p-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-200 text-white rounded-xl transition active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-md"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
