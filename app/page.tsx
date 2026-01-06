'use client';
import React, { useState, useRef, useEffect, useCallback, use } from 'react';
import {encode, decode, decodeAudioData } from '@/utils/audioUtils';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Play,
  Square,
  Send, 
  Loader2, 
  ShieldCheck,
  BookOpen,
  GraduationCap,
  PhoneCall,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Icon
} from 'lucide-react';
import { LiveServerMessage, Modality } from '@google/genai';
import { Message } from '@/types';
import { getGeminiResponse, getGeminiTTS } from '@/services/geminiService';
import {ai} from "@/lib/gemini-config";
import AIAvatar from '@/components/AIAvatar';
import Link from 'next/link';
import { BAWASLU_SYSTEM_PROMPT } from '@/constants';

// Audio Encoding & Decoding Helpers
//Audio Utils
/* 
const encode = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};


const decode = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
} */

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Halo! Saya asisten virtual pengawasan pemilu Anda. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live API & TTS Refs
  const sessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');
  
  // Ref untuk menyimpan audio terakhir agar bisa di-replay
  const lastAudioDataRef = useRef<string | null>(null);

  // Initialize Audio Context for playback
  const initOutputAudio = () => {
    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return outputAudioCtxRef.current;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, showChat]);

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsPlaying(false);
  }, []);

  const playRawAudio = async (base64Audio: string) => {
    const ctx = initOutputAudio();
    if (ctx.state === 'suspended') await ctx.resume();
    
    const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(ctx.destination);
    
    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
    sourceNode.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
    
    sourcesRef.current.add(sourceNode);
    setIsPlaying(true);

    sourceNode.onended = () => {
      sourcesRef.current.delete(sourceNode);
      if (sourcesRef.current.size === 0) {
        setIsPlaying(false);
        nextStartTimeRef.current = 0;
      }
    };
  };

  const stopLiveSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    stopAllAudio();
    setIsLiveActive(false);
  }, [stopAllAudio]);

  const startLiveSession = async () => {
    if (isLiveActive) {
      stopLiveSession();
      return;
    }

    try {
      setIsLiveActive(true);
      setShowChat(true);
      
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      initOutputAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        
        callbacks: {
          onopen: () => {
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) currentInputTransRef.current += message.serverContent.inputTranscription.text;
            if (message.serverContent?.outputTranscription) currentOutputTransRef.current += message.serverContent.outputTranscription.text;
            
            if (message.serverContent?.turnComplete) {
              const inputTxt = currentInputTransRef.current;
              const outputTxt = currentOutputTransRef.current;
              if (inputTxt || outputTxt) {
                setMessages(prev => [
                  ...prev, 
                  ...(inputTxt ? [{ role: 'user', content: inputTxt } as Message] : []),
                  ...(outputTxt ? [{ role: 'ai', content: outputTxt } as Message] : [])
                ]);
              }
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              await playRawAudio(base64Audio);
            }

            if (message.serverContent?.interrupted) {
              stopAllAudio();
            }
          },
          onerror: (e) => { console.error('Session error:', e); stopLiveSession(); },
          onclose: () => setIsLiveActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: BAWASLU_SYSTEM_PROMPT,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      setIsLiveActive(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;
    if (!showChat) setShowChat(true);

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    stopAllAudio(); // Stop previous audio when sending new query

    const history = messages.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const responseText = await getGeminiResponse(messageText, history);
    if (responseText) {
      setMessages(prev => [...prev, { role: 'ai', content: responseText }]);
      /*
      const ttsData = await getGeminiTTS(responseText);
      if (ttsData) {
        lastAudioDataRef.current = ttsData;
        await playRawAudio(ttsData);
      }
*/
      lastAudioDataRef.current = null; // Reset audio terakhir

    } else {
      setMessages(prev => [...prev, { role: 'ai', content: "Maaf, silakan coba lagi." }]);
    }
    setIsLoading(false);
  };

  const playMessageAudio = async (text: string) => {
    if (isPlaying) {
      stopAllAudio();
      return;
    }
   setIsLoading(true);
    const ttsData = await getGeminiTTS(text);
    setIsLoading(false);
    
    if (ttsData) {
      lastAudioDataRef.current = ttsData;
      await playRawAudio(ttsData);
    }


  };



  const menuItems = [
    { label: 'Cek Status Laporan', icon: 'fa-shield-halved', q: 'Bagaimana cara cek status laporan?' },
    { label: 'Syarat Pelaporan Pelanggaran', icon: 'fa-book-open', q: 'Apa syarat lapor pelanggaran?' },
    { label: 'Edukasi Pemilih', icon: 'fa-graduation-cap', q: 'Berikan edukasi pemilih.' },
    { label: 'Kontak Kami', icon: 'fa-phone', q: 'Hubungi Bawaslu Lamongan.' },
  ];

  return (
    <div className="relative flex flex-col h-[100dvh] max-w-[480px] mx-auto bg-black overflow-hidden font-sans border-x border-white/10">
      <AIAvatar isSpeaking={isSpeaking} isListening={isListening} />
      <div className="relative z-10 flex flex-col h-full bg-black/20">
        
        {/* Header */}
        <header className="flex items-center p-3 border-b border-white/20 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-md">
          <div className="bg-[#FF5C00] p-1.5 rounded-lg mr-2.5 shadow-lg">
            <i className="fas fa-shield-halved text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900 tracking-tighter uppercase">Bawaslu Lamongan</h1>
            <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Asisten AI</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 flex flex-col scrollbar-hide space-y-4">
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="flex flex-col min-h-full">
  

            {/* Chat History View */}
            {showChat && (
              <section className="px-8 py-8 border-t border-orange-100 bg-orange-50/10">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full">Percakapan</h3>
                   <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-black">
                     <ChevronUp size={24} />
                   </button>
                </div>
                
                <div className="flex flex-col gap-5">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] px-5 py-4 rounded-[2rem] text-sm  shadow-sm relative group ${
                        msg.role === 'user' 
                          ? 'bg-black text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                      }`}>
                        {msg.content}
                        {msg.role === 'ai' && idx === messages.length - 1 && (
                           <div className="mt-3 flex gap-2">
                             {isPlaying ? (
                               <button onClick={stopAllAudio} className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors shadow-sm">
                                 <Square size={12} fill="currentColor" />
                               </button>
                             ) : (
                               <button onClick={() => playMessageAudio(msg.content)} 
                                 disabled={isLoading} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors shadow-sm">
                                 <Play size={12} fill="currentColor" />
                               </button>
                             )}
                           </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex flex-col items-start">
                      <div className="bg-orange-600 text-white px-5 py-4 rounded-[2rem] rounded-tl-none text-xs flex items-center gap-2 font-black shadow-lg">
                        <Loader2 size={16} className="animate-spin" /> Proses...
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
            
            {!showChat && messages.length > 1 && (
              <button 
                onClick={() => setShowChat(true)}
                className="mx-8 mb-8 py-3 border-b-2 border-dashed border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-orange-600 transition-colors"
              >
                Lihat Histori Chat <ChevronDown size={14} />
              </button>
            )}
          </div>
        </div>
     </main>
        {/* Footer Area */}
 <footer className="bg-white/95 backdrop-blur-3xl border-t border-white/20 px-4 pb-8 pt-4 space-y-4 shadow-2xl z-30">          <div className="relative group">
                {/* Quick Menu */}
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map((item, i) => (
              <button key={i} onClick={() => handleSend(item.q)} disabled={isTyping} className="flex items-center gap-2 bg-gray-100 p-2.5 rounded-xl border border-gray-100 hover:bg-orange-200 cursor-pointer shadow-sm transition-colors">
                <div className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded-full">
                  <i className={`fas ${item.icon} text-[#FF5C00] text-[10px]`}></i>
                </div>
                <span className="text-[10px] font-bold text-gray-600">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="margin: auto mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">

          </div>
          <div className="flex items-center gap-2.5">  
            
      <button 
            onClick={startLiveSession}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-xl active:scale-90 ${
              isLiveActive 
                ? 'bg-red-500 text-white shadow-red-900/20' 
                : 'bg-orange-600 text-white shadow-orange-900/20 hover:bg-orange-500'
            }`}
          >
            {isLiveActive ? <MicOff size={22} /> : <Mic size={22} />}
          </button>   
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 border border-gray-200 focus-within:ring-4 focus-within:ring-orange-100 focus-within:border-orange-400 transition-all">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter'} placeholder="Tanya sesuatu..." className="flex-1 bg-transparent py-3 text-xs font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none" />
              <button type="submit" disabled={!input.trim() || isTyping} className="text-[#FF5C00] disabled:opacity-30"><i className="fas fa-paper-plane"></i></button>
            </form>
        </div>
      </div>
          <div className="mt-8 flex flex-col items-center gap-2 text-[10px] text-gray-400 text-center font-black tracking-[0.2em] uppercase">
            <p>© 2025 BAWASLU KABUPATEN LAMONGAN</p>
          </div>
        </footer>

      </div>

    </div>
  );
};

export default App;
