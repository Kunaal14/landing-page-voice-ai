
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { ConnectionStatus, Message } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../services/audioUtils';
import Visualizer from './Visualizer';

const TRANSCRIPT_WEBHOOK_URL = "https://kunaal-n8n-app.proudsmoke-84fb7068.northeurope.azurecontainerapps.io/webhook/landing-page";
const MAX_CALL_DURATION = 300; // 5 minutes
const SILENCE_TIMEOUT_MS = 20000; 
const VAD_SENSITIVITY = 1.1;

const SYSTEM_INSTRUCTION = `
You are 'Nova', the lead Voice AI specialist at NovaVoice AI.

## PERSONA:
- Professional, fluent, and extremely patient.
- You are here to demonstrate how our AI receptionists work.
- Use natural conversation. 

## CONVERSATION FLOW:
1. Greet the user and ask for their name and business type.
2. Answer any questions they have about AI receptionists or lead capture.
3. Try to get an email address to send them a follow-up demo plan.
4. NEVER end the call yourself unless the user says "Goodbye", "I'm done", or "End call".

## IMPORTANT:
- If the user is mid-sentence or sounds like they have more to say, WAIT. 
- Do not use 'terminate_call' unless the user is explicitly finished.
`;

const tools: { functionDeclarations: FunctionDeclaration[] }[] = [{
  functionDeclarations: [
    {
      name: 'capture_lead_info',
      description: 'Records lead details into the business CRM.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          business_nature: { type: Type.STRING }
        },
        required: ['name', 'email']
      }
    },
    {
      name: 'terminate_call',
      description: 'Ends the voice session and closes the connection.',
      parameters: { type: Type.OBJECT, properties: {} }
    }
  ]
}];

const VoiceAgent: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcriptState, setTranscriptState] = useState<Message[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<{user: string, agent: string}>({user: '', agent: ''});
  const [timeLeft, setTimeLeft] = useState(MAX_CALL_DURATION);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<Message[]>([]);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pendingTerminationRef = useRef(false);
  
  const noiseFloorRef = useRef(0.005);
  const vadHangTimeRef = useRef(0);

  const mixedDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const leadDataRef = useRef<any>({ name: '', email: '', business_nature: '' });

  const inputBuffer = useRef('');
  const outputBuffer = useRef('');

  const stopSession = useCallback(() => {
    if (status === ConnectionStatus.DISCONNECTED) return;
    
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current?.stop(); } catch(e) {}
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    
    activeSourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    
    setStatus(ConnectionStatus.DISCONNECTED);
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
    sessionPromiseRef.current = null;
    setTimeLeft(MAX_CALL_DURATION);
    setLiveTranscript({user: '', agent: ''});
    nextStartTimeRef.current = 0;
    pendingTerminationRef.current = false;
  }, [status]);

  const finalizeAndSend = useCallback(async (audioBlob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1];
      try {
        const payload = {
          session_id: `nova_demo_${Date.now()}`,
          lead_data: leadDataRef.current,
          full_transcript: transcriptRef.current,
          duration_seconds: MAX_CALL_DURATION - timeLeft,
          audio_file: base64Audio 
        };
        await fetch(TRANSCRIPT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) { console.error("Webhook Delivery Failed", e); }
    };
  }, [timeLeft]);

  useEffect(() => {
    let activityInterval: number | null = null;
    if (status === ConnectionStatus.CONNECTED) {
      lastActivityRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { stopSession(); return 0; }
          return prev - 1;
        });
      }, 1000);

      activityInterval = window.setInterval(() => {
        if (Date.now() - lastActivityRef.current > SILENCE_TIMEOUT_MS) {
          stopSession();
        }
      }, 1000);
    }
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current);
      if (activityInterval) clearInterval(activityInterval);
    };
  }, [status, stopSession]);

  const startSession = async () => {
    try {
      setStatus(ConnectionStatus.CONNECTING);
      transcriptRef.current = [];
      setTranscriptState([]);
      audioChunksRef.current = [];
      leadDataRef.current = { name: '', email: '', business_nature: '' };
      pendingTerminationRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const mixedDest = outputCtx.createMediaStreamDestination();
      mixedDestRef.current = mixedDest;
      outputCtx.createMediaStreamSource(stream).connect(mixedDest);

      const mediaRecorder = new MediaRecorder(mixedDest.stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => finalizeAndSend(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      mediaRecorder.start(1000);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: tools,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus(ConnectionStatus.CONNECTED);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (pendingTerminationRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              let sumSquares = 0;
              for(let i=0; i<inputData.length; i++) sumSquares += inputData[i] * inputData[i];
              const rms = Math.sqrt(sumSquares / inputData.length);
              noiseFloorRef.current = (noiseFloorRef.current * 0.99) + (rms * 0.01);

              if (rms > noiseFloorRef.current * VAD_SENSITIVITY && rms > 0.003) {
                setIsUserSpeaking(true);
                lastActivityRef.current = Date.now();
                vadHangTimeRef.current = 60;
                sessionPromise.then(s => s.sendRealtimeInput({ media: createPcmBlob(inputData) }));
              } else if (vadHangTimeRef.current > 0) {
                vadHangTimeRef.current--;
                sessionPromise.then(s => s.sendRealtimeInput({ media: createPcmBlob(inputData) }));
              } else {
                setIsUserSpeaking(false);
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            sessionPromise.then(s => s.sendRealtimeInput({ text: "Hi Nova, I'm a visitor. Briefly introduce yourself and ask how you can help with my business today." }));
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              // CAPTURE INTERRUPTED TRANSCRIPT
              if (outputBuffer.current.trim()) {
                const interruptedText = `${outputBuffer.current.trim()}...`;
                const newHistory = [...transcriptRef.current, { role: 'agent' as const, text: interruptedText }];
                transcriptRef.current = newHistory;
                setTranscriptState(newHistory);
              }
              
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAgentSpeaking(false);
              setLiveTranscript(prev => ({ ...prev, agent: '' }));
              outputBuffer.current = '';
            }

            if (message.toolCall) {
              const session = await sessionPromise;
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'terminate_call') {
                  pendingTerminationRef.current = true;
                  session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { status: "hanging_up" } } });
                } else {
                  setActiveTool(fc.name);
                  leadDataRef.current = { ...leadDataRef.current, ...fc.args };
                  session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { success: true } } });
                  setTimeout(() => setActiveTool(null), 2000);
                }
              }
            }

            if (message.serverContent?.inputTranscription) {
              inputBuffer.current += message.serverContent.inputTranscription.text;
              setLiveTranscript(prev => ({ ...prev, user: inputBuffer.current }));
              lastActivityRef.current = Date.now();
            }
            if (message.serverContent?.outputTranscription) {
              outputBuffer.current += message.serverContent.outputTranscription.text;
              setLiveTranscript(prev => ({ ...prev, agent: outputBuffer.current }));
              lastActivityRef.current = Date.now(); 
            }

            if (message.serverContent?.turnComplete) {
              const userFinal = inputBuffer.current.trim();
              const agentFinal = outputBuffer.current.trim();
              if (userFinal || agentFinal) {
                const newHistory = [...transcriptRef.current];
                if (userFinal) newHistory.push({ role: 'user', text: userFinal });
                if (agentFinal) newHistory.push({ role: 'agent', text: agentFinal });
                transcriptRef.current = newHistory;
                setTranscriptState(newHistory);
              }
              inputBuffer.current = '';
              outputBuffer.current = '';
              setLiveTranscript({ user: '', agent: '' });
              
              if (pendingTerminationRef.current && !isAgentSpeaking && activeSourcesRef.current.size === 0) {
                setTimeout(stopSession, 500);
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current && mixedDestRef.current) {
              const { output: ctx } = audioContextRef.current;
              if (ctx.state === 'suspended') ctx.resume();
              
              setIsAgentSpeaking(true);
              lastActivityRef.current = Date.now(); 
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.connect(mixedDestRef.current);
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) {
                  setIsAgentSpeaking(false);
                  if (pendingTerminationRef.current) {
                    setTimeout(stopSession, 1000);
                  }
                }
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }
          },
          onerror: () => stopSession(),
          onclose: () => stopSession()
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) { setStatus(ConnectionStatus.DISCONNECTED); }
  };

  return (
    <div className="flex flex-col items-center p-8 bg-[#0a0a0a] border border-white/5 rounded-[3rem] shadow-2xl backdrop-blur-md max-w-md w-full mx-auto relative z-20 overflow-hidden min-h-[680px]">
      
      {/* Session Timer (Only when active) */}
      {status === ConnectionStatus.CONNECTED && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/40 tracking-[0.2em] z-30 flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>SESSION: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>
      )}

      {status === ConnectionStatus.DISCONNECTED ? (
        <div className="flex-1 w-full flex flex-col items-center justify-between py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="mt-12 flex flex-col items-center">
            {/* Pulsing Neural Orb */}
            <div className="relative mb-12">
               <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full scale-150 animate-pulse" />
               <div className="w-36 h-36 bg-indigo-600/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_80px_rgba(79,70,229,0.15)] group transition-all duration-700 hover:scale-110 hover:border-indigo-500/40">
                  <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m8 0h-3m4-12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
               </div>
            </div>

            <h3 className="text-4xl font-outfit font-bold text-white mb-2 text-center tracking-tighter">Nova AI</h3>
            <p className="text-white/20 text-[10px] uppercase tracking-[0.4em] font-bold">Intelligent Voice Agent</p>
          </div>

          {/* Bottom Call Action */}
          <div className="w-full">
            <button 
                onClick={startSession}
                className="w-full py-8 bg-white text-black font-black text-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(255,255,255,0.2)] hover:bg-white/95 transition-all active:scale-[0.97] flex flex-col items-center group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center text-black">
                Start a Call
                <div className="ml-3 p-1 bg-black/5 rounded-lg group-hover:translate-x-1 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </span>
              <div className="absolute inset-0 bg-indigo-50 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col animate-in fade-in duration-500">
          
          <div className="flex-1 flex flex-col items-center justify-center pt-16">
            <div className="relative mb-16">
              {/* Dynamic Visualization Rings */}
              <div className={`absolute inset-0 rounded-full blur-[100px] transition-all duration-700 ${isUserSpeaking ? 'bg-indigo-500/40 scale-150' : (isAgentSpeaking ? 'bg-indigo-400/20 scale-125' : 'bg-transparent')}`} />
              
              <div className={`w-44 h-44 rounded-full flex items-center justify-center transition-all duration-700 ${status === ConnectionStatus.CONNECTED ? 'bg-white/[0.01] border border-white/5 shadow-inner' : ''}`}>
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isAgentSpeaking ? 'bg-indigo-400 scale-105 shadow-[0_0_60px_rgba(129,140,248,0.4)]' : 'bg-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.2)]'} shadow-2xl`}>
                  {isAgentSpeaking ? (
                    <div className="flex items-center space-x-1.5">
                      {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-10 bg-white rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />)}
                    </div>
                  ) : (
                    <svg className={`w-14 h-14 text-white ${isUserSpeaking ? 'scale-110' : 'opacity-80'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m8 0h-3m4-12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center h-20 flex flex-col justify-center">
              {activeTool ? (
                <div className="flex flex-col items-center animate-pulse text-indigo-400">
                  <div className="text-[10px] font-mono uppercase tracking-[0.5em] mb-2 font-black">Updating CRM</div>
                  <div className="text-white/40 text-[11px]">Syncing lead metadata...</div>
                </div>
              ) : (
                <>
                  <h3 className="text-3xl font-outfit font-bold text-white mb-1 tracking-tighter">
                    {isAgentSpeaking ? "Nova" : (isUserSpeaking ? "Listening..." : "Waiting for You")}
                  </h3>
                  <p className="text-white/20 text-[10px] uppercase tracking-[0.4em] font-black">
                    {status === ConnectionStatus.CONNECTING ? "Connecting Link" : "Active Neural Stream"}
                  </p>
                </>
              )}
            </div>
            
            <div className="w-full px-12 mt-8">
               <Visualizer isActive={status === ConnectionStatus.CONNECTED} color={isAgentSpeaking ? "#818cf8" : (isUserSpeaking ? "#ffffff" : "#4f46e5")} />
            </div>
          </div>

          <div className="h-44 overflow-y-auto mb-8 px-8 no-scrollbar space-y-4 bg-white/[0.01] rounded-[2.5rem] py-8 border border-white/5 flex flex-col-reverse shadow-inner">
             {liveTranscript.agent && <div className="text-white/50 italic text-sm text-left animate-pulse">{liveTranscript.agent}...</div>}
             {liveTranscript.user && <div className="text-indigo-400 italic text-sm text-right animate-pulse">{liveTranscript.user}...</div>}
             
             {transcriptState.slice().reverse().map((msg, i) => (
                <div key={i} className={`text-[13px] leading-relaxed ${msg.role === 'user' ? 'text-indigo-400/80 text-right font-medium' : 'text-white/70 text-left font-light'}`}>
                  {msg.text}
                </div>
             ))}
          </div>

          <button onClick={stopSession} className="w-full py-5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/20 font-black text-[10px] uppercase tracking-[0.4em] rounded-2xl transition-all border border-white/5 mb-2 hover:border-red-500/20 group">
            <span className="group-hover:scale-105 transition-transform block">End Connection</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceAgent;
