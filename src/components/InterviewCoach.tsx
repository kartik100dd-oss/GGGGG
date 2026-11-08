import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, Sparkles, AlertCircle, RefreshCw, Star } from 'lucide-react';
import { auth, saveChatSession, loadChatSession, ChatMessage } from '../firebase';
import { StudentProfile } from '../types';

interface InterviewCoachProps {
  profile: StudentProfile | null;
}

export default function InterviewCoach({ profile }: InterviewCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firestore on boot
  useEffect(() => {
    async function loadHistory() {
      if (profile && profile.uid) {
        try {
          const history = await loadChatSession(profile.uid, 'interview_coach');
          if (history.length > 0) {
            setMessages(history);
          } else {
            // Initial welcoming message
            const welcomeMsg: ChatMessage = {
              sender: 'ai',
              text: `Hello ${profile.name}! I am your AI Interview Coach. Based on your stream (${profile.stream}) and interest in ${profile.careerInterests || 'your career fields'}, I am ready to conduct a simulated interview. Shall we start with a standard HR question or dive straight into your stream's Technical questions?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages([welcomeMsg]);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        } finally {
          setInitializing(false);
        }
      } else {
        setInitializing(false);
      }
    }
    loadHistory();
  }, [profile]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || !profile) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Save user message to Firestore
      await saveChatSession(profile.uid, 'interview_coach', updatedMessages);

      const response = await fetch('/api/interview-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          chatHistory: updatedMessages
        })
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (e: any) {
        throw new Error(`Invalid response format from coach API (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Interview Coach API failed');
      }
      
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      
      // Save AI reply to Firestore
      await saveChatSession(profile.uid, 'interview_coach', finalMessages);
    } catch (error) {
      console.error('Error in Interview Coach:', error);
      const errorMsg: ChatMessage = {
        sender: 'ai',
        text: 'Apologies, I encountered an error communicating with our assessment models. Please check if your GEMINI_API_KEY is configured in the Secrets panel.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...updatedMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!profile) return;
    if (!window.confirm('Are you sure you want to reset this mock interview session?')) return;
    
    const initialMsg: ChatMessage = {
      sender: 'ai',
      text: `Mock interview reset. Hello ${profile.name}! I'm ready to restart. Would you prefer a technical scenario or a standard behavioral question to practice first?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([initialMsg]);
    await saveChatSession(profile.uid, 'interview_coach', [initialMsg]);
  };

  if (initializing) {
    return (
      <div className="flex justify-center items-center h-48">
        <RefreshCw className="animate-spin text-red-500 mr-2" />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Warming Up Interview Coach...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <MessageSquare className="text-red-400" size={22} />
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-slate-900 animate-pulse"></span>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-wide">AI MOCK INTERVIEW COACH</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Recruiter Mode: Active</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 hover:text-red-400 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
        >
          Reset Session
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-xs text-xs ${isUser ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                <p className="leading-relaxed font-medium">{m.text}</p>
                <span className={`block text-[8px] mt-1.5 text-right ${isUser ? 'text-red-200' : 'text-gray-400'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-xs rounded-tl-none flex items-center space-x-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recruiter is analyzing</span>
              <span className="flex space-x-1">
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick reply templates */}
      <div className="px-4 py-2 bg-slate-100 border-t border-gray-100 overflow-x-auto whitespace-nowrap flex space-x-2">
        <button
          onClick={() => handleSend("Let's start with a standard HR interview question.")}
          disabled={loading || !profile}
          className="inline-flex items-center px-2.5 py-1.5 bg-white border border-gray-200 hover:border-red-300 rounded-lg text-[10px] font-bold text-gray-600 transition active:scale-95 disabled:opacity-50"
        >
          <Sparkles size={10} className="mr-1 text-amber-500" />
          HR Question
        </button>
        <button
          onClick={() => handleSend("I want to practice a Technical question for my stream.")}
          disabled={loading || !profile}
          className="inline-flex items-center px-2.5 py-1.5 bg-white border border-gray-200 hover:border-red-300 rounded-lg text-[10px] font-bold text-gray-600 transition active:scale-95 disabled:opacity-50"
        >
          <Star size={10} className="mr-1 text-red-500" />
          Technical question
        </button>
        <button
          onClick={() => handleSend("Can you evaluate my last answer and give me feedback on where to improve?")}
          disabled={loading || !profile}
          className="inline-flex items-center px-2.5 py-1.5 bg-white border border-gray-200 hover:border-red-300 rounded-lg text-[10px] font-bold text-gray-600 transition active:scale-95 disabled:opacity-50"
        >
          <AlertCircle size={10} className="mr-1 text-blue-500" />
          Give me feedback
        </button>
      </div>

      {/* Input box */}
      <div className="p-3 bg-white border-t border-gray-100 flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading || !profile}
          placeholder={profile ? "Type your response to the recruiter..." : "Please configure your student profile first."}
          className="flex-1 text-xs border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 disabled:bg-gray-100"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim() || !profile}
          className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl shadow-md transition active:scale-95 disabled:bg-gray-300"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
