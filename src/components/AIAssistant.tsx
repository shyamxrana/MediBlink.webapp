import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Mic, MicOff, Volume2, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '@/utils/cn';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isAudio?: boolean;
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mediblink_chat_history');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse chat history', e);
        }
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live API state
  const [session, setSession] = useState<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    localStorage.setItem('mediblink_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendText = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        history: history,
        config: {
          systemInstruction: "You are a helpful medical assistant for the MediBlink app. You can help users find doctors, understand medical terms, and navigate the app.",
        },
      });

      const response = await chat.sendMessage({ message: input });

      const assistantMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response.text || "I couldn't process that request." 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudioBase64 = async (base64Audio: string, sampleRate: number = 24000) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // The data is 16-bit PCM. We need to convert it to Float32.
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 0x8000;
      }
      
      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const playTTS = async (text: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await playAudioBase64(base64Audio, 24000);
      }
    } catch (error) {
      console.error("TTS error:", error);
    }
  };

  const startLiveAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
      } });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a helpful medical assistant. Keep your answers concise.",
        },
        callbacks: {
          onopen: () => {
             setIsRecording(true);
             processor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const pcm16 = new Int16Array(inputData.length);
               for (let i = 0; i < inputData.length; i++) {
                 let s = Math.max(-1, Math.min(1, inputData[i]));
                 pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
               }
               const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
               sessionPromise.then((s) =>
                 s.sendRealtimeInput({
                     audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                 })
               );
             };
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              try {
                const audioCtx = audioContextRef.current;
                const binaryString = window.atob(base64Audio);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                
                const int16Array = new Int16Array(bytes.buffer);
                const float32Array = new Float32Array(int16Array.length);
                for (let i = 0; i < int16Array.length; i++) {
                  float32Array[i] = int16Array[i] / 0x8000;
                }
                
                const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
                audioBuffer.getChannelData(0).set(float32Array);
                
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                source.start();
              } catch (error) {
                console.error("Error playing live audio:", error);
              }
            }
          },
          onclose: () => {
            stopLiveAudio();
          },
          onerror: (err) => {
            console.error("Live API error:", err);
            stopLiveAudio();
          }
        }
      });

      setSession(sessionPromise);

    } catch (error) {
      console.error("Error starting live audio:", error);
    }
  };

  const stopLiveAudio = () => {
    setIsRecording(false);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (session) {
      session.then((s: any) => s.close());
      setSession(null);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopLiveAudio();
    } else {
      startLiveAudio();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-indigo-600 p-4 text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-indigo-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex border-b border-gray-100 p-2 bg-gray-50">
              <button
                className={cn("flex-1 rounded-md py-1.5 text-sm font-medium transition-colors", mode === 'chat' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                onClick={() => setMode('chat')}
              >
                Text Chat
              </button>
              <button
                className={cn("flex-1 rounded-md py-1.5 text-sm font-medium transition-colors", mode === 'voice' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                onClick={() => setMode('voice')}
              >
                Voice Call
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {mode === 'chat' ? (
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 text-sm">
                      Hi! I'm your AI assistant. How can I help you today?
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm", msg.role === 'user' ? "bg-indigo-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm")}>
                        {msg.content}
                        {msg.role === 'assistant' && (
                          <button onClick={() => playTTS(msg.content)} className="ml-2 inline-flex items-center text-gray-400 hover:text-indigo-600">
                            <Volume2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900">Live Voice Assistant</h4>
                    <p className="text-sm text-gray-500 mt-1">Have a natural conversation</p>
                  </div>
                  
                  <motion.button
                    onClick={toggleRecording}
                    className={cn(
                      "flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-colors",
                      isRecording ? "bg-red-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    )}
                    animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                    transition={isRecording ? { repeat: Infinity, duration: 2 } : {}}
                  >
                    {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                  </motion.button>
                  
                  <p className="text-sm font-medium text-gray-600">
                    {isRecording ? "Listening... Tap to stop" : "Tap to start speaking"}
                  </p>
                </div>
              )}
            </div>

            {/* Input Area (Chat Mode Only) */}
            {mode === 'chat' && (
              <div className="border-t border-gray-200 bg-white p-3">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendText(); }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <Button type="submit" size="icon" className="rounded-full bg-indigo-600 hover:bg-indigo-700 shrink-0 h-10 w-10" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
