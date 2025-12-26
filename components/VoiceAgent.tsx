
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { ConnectionStatus, Message } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../services/audioUtils';
import Visualizer from './Visualizer';

// Sub-components
import Avatar from './voice/Avatar';
import TranscriptBox from './voice/TranscriptBox';
import StatusHeader from './voice/StatusHeader';
import Controls from './voice/Controls';

const TRANSCRIPT_WEBHOOK_URL = "https://kunaal-n8n-app.proudsmoke-84fb7068.northeurope.azurecontainerapps.io/webhook/landing-page";
const CALENDAR_AVAILABILITY_URL = "https://kunaal-n8n-app.proudsmoke-84fb7068.northeurope.azurecontainerapps.io/webhook/calendar-availability"; // Update with your actual endpoint
const MAX_CALL_DURATION = 300; 
const SILENCE_TIMEOUT_MS = 15000; // Exact 15s
const MIN_RMS_THRESHOLD = 0.003; // More sensitive floor
const VAD_SENSITIVITY = 1.15; // More forgiving multiplier

const SYSTEM_INSTRUCTION = `
You are 'Sara', the lead Voice AI specialist at Tigest.

## PERSONA:
- Professional, fluent, and extremely patient.
- You demonstrate how Tigest AI receptionists work.

## TERMINATION PROTOCOL:
- IMPORTANT: When the user says goodbye or the conversation is clearly over, YOU MUST say a short closing remark and then call the 'terminate_call' tool immediately.
- Once business is concluded (lead captured or info provided), don't linger.

## CONVERSATION FLOW:
1. Greet the user, ask for their name and business type.
2. Answer questions about AI lead capture.
3. If the user asks about scheduling, availability, or booking, use the 'get_calendar_availability' tool to fetch available time slots.
4. Present the available slots to the user in a natural, conversational way.
5. Attempt to get an email for a follow-up.
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
      name: 'get_calendar_availability',
      description: 'Fetches available time slots from the calendar. Use this when the user asks about availability, scheduling, or what times are open. Returns a list of available time slots that can be used for booking.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          date: { 
            type: Type.STRING,
            description: 'Optional date in YYYY-MM-DD format. If not provided, defaults to today and next few days.'
          },
          duration_minutes: {
            type: Type.NUMBER,
            description: 'Optional duration in minutes for the appointment. Defaults to 30 if not specified.'
          }
        },
        required: []
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
  const timerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pendingTerminationRef = useRef(false);
  const sessionActiveRef = useRef(false);
  
  const noiseFloorRef = useRef(0.005);
  const vadHangTimeRef = useRef(0);

  const mixedDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const leadDataRef = useRef<any>({ name: '', email: '', business_nature: '' });

  const inputBuffer = useRef('');
  const outputBuffer = useRef('');

  const stopSession = useCallback(() => {
    sessionActiveRef.current = false;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch(e) {}
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
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
      audioContextRef.current.input.close().catch(() => {});
      audioContextRef.current.output.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    setStatus(ConnectionStatus.DISCONNECTED);
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
    setTimeLeft(MAX_CALL_DURATION);
    setLiveTranscript({user: '', agent: ''});
    nextStartTimeRef.current = 0;
    pendingTerminationRef.current = false;
  }, [status]);

  const finalizeAndSend = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size === 0) return;
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1];
      try {
        const payload = {
          session_id: `tigest_demo_${Date.now()}`,
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
        // Heartbeat logic
        if (isAgentSpeaking || isUserSpeaking) {
          lastActivityRef.current = Date.now();
          return;
        }

        if (Date.now() - lastActivityRef.current > SILENCE_TIMEOUT_MS) {
          console.log("Terminating: Inactivity.");
          stopSession();
        }
      }, 1000);
    }
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current);
      if (activityInterval) clearInterval(activityInterval);
    };
  }, [status, stopSession, isAgentSpeaking, isUserSpeaking]);

  const startSession = async () => {
    try {
      setStatus(ConnectionStatus.CONNECTING);
      transcriptRef.current = [];
      setTranscriptState([]);
      audioChunksRef.current = [];
      leadDataRef.current = { name: '', email: '', business_nature: '' };
      pendingTerminationRef.current = false;
      lastActivityRef.current = Date.now();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } });
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
            console.log("Session Opened");
            sessionActiveRef.current = true;
            setStatus(ConnectionStatus.CONNECTED);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!sessionActiveRef.current || pendingTerminationRef.current) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              let sumSquares = 0;
              for(let i=0; i<inputData.length; i++) sumSquares += inputData[i] * inputData[i];
              const rms = Math.sqrt(sumSquares / inputData.length);

              // Update noise floor slowly
              if (!isUserSpeaking && !isAgentSpeaking) {
                noiseFloorRef.current = (noiseFloorRef.current * 0.99) + (rms * 0.01);
              }

              const isDetectingSpeech = rms > Math.max(noiseFloorRef.current * VAD_SENSITIVITY, MIN_RMS_THRESHOLD);

              if (isDetectingSpeech) {
                setIsUserSpeaking(true);
                lastActivityRef.current = Date.now();
                vadHangTimeRef.current = 15; // Maintain for ~1.5s
                sessionPromise.then(s => {
                  if (sessionActiveRef.current) s.sendRealtimeInput({ media: createPcmBlob(inputData) });
                }).catch(() => {});
              } else if (vadHangTimeRef.current > 0) {
                vadHangTimeRef.current--;
                sessionPromise.then(s => {
                  if (sessionActiveRef.current) s.sendRealtimeInput({ media: createPcmBlob(inputData) });
                }).catch(() => {});
              } else {
                setIsUserSpeaking(false);
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            
            sessionPromise.then(s => {
              if (sessionActiveRef.current) s.sendRealtimeInput({ text: "Introduce yourself as Sara from Tigest. Greet me warmly and ask for my name and business." });
            }).catch(() => {});
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!sessionActiveRef.current) return;
            lastActivityRef.current = Date.now();

            if (message.serverContent?.interrupted) {
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
                } else if (fc.name === 'get_calendar_availability') {
                  // Handle calendar availability tool call
                  setActiveTool(fc.name);
                  try {
                    // Make POST request to get calendar availability
                    const response = await fetch(CALENDAR_AVAILABILITY_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        date: fc.args.date || null,
                        duration_minutes: fc.args.duration_minutes || 30,
                        session_id: `tigest_demo_${Date.now()}`
                      }),
                    });
                    
                    if (response.ok) {
                      const availabilityData = await response.json();
                      // Send the availability data back to the AI so it can continue the conversation
                      session.sendToolResponse({ 
                        functionResponses: { 
                          id: fc.id, 
                          name: fc.name, 
                          response: {
                            success: true,
                            available_slots: availabilityData.available_slots || [],
                            message: availabilityData.message || "Here are the available time slots."
                          }
                        } 
                      });
                    } else {
                      // Handle error case
                      session.sendToolResponse({ 
                        functionResponses: { 
                          id: fc.id, 
                          name: fc.name, 
                          response: {
                            success: false,
                            error: "Unable to fetch calendar availability at this time. Please try again later."
                          }
                        } 
                      });
                    }
                  } catch (error) {
                    console.error("Calendar availability fetch failed:", error);
                    session.sendToolResponse({ 
                      functionResponses: { 
                        id: fc.id, 
                        name: fc.name, 
                        response: {
                          success: false,
                          error: "There was an error checking calendar availability."
                        }
                      } 
                    });
                  }
                  setTimeout(() => setActiveTool(null), 2000);
                } else if (fc.name === 'capture_lead_info') {
                  // Handle lead capture
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
            }
            if (message.serverContent?.outputTranscription) {
              outputBuffer.current += message.serverContent.outputTranscription.text;
              setLiveTranscript(prev => ({ ...prev, agent: outputBuffer.current }));
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
                    setTimeout(stopSession, 1200);
                  }
                }
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }
          },
          onerror: (e) => {
            console.error("Gemini Session Error:", e);
            setStatus(ConnectionStatus.ERROR);
            setTimeout(stopSession, 3000);
          },
          onclose: () => {
            console.log("Session Closed by server");
            stopSession();
          }
        }
      });
    } catch (err) { 
      console.error("Start Session Failed:", err);
      setStatus(ConnectionStatus.ERROR);
      setTimeout(stopSession, 3000);
    }
  };

  return (
    <div id="voice-agent-container" className="flex flex-col items-center p-8 bg-[#0a0a0a] border border-white/5 rounded-[3rem] shadow-2xl backdrop-blur-md max-w-md w-full mx-auto relative z-20 overflow-hidden min-h-[680px]">
      
      <StatusHeader timeLeft={timeLeft} status={status} />

      {status === ConnectionStatus.ERROR && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-12 text-center animate-in fade-in duration-300">
           <div className="space-y-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/40">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">Connection Interrupted</h4>
              <p className="text-white/40 text-sm">A network issue occurred. Please check your internet and try again.</p>
              <button onClick={stopSession} className="px-6 py-3 bg-white text-black font-bold rounded-xl text-xs uppercase tracking-widest">Reset Agent</button>
           </div>
        </div>
      )}

      {status === ConnectionStatus.DISCONNECTED ? (
        <div className="flex-1 w-full flex flex-col items-center justify-between py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mt-12 flex flex-col items-center">
            <div className="relative mb-12">
               <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full scale-150 animate-pulse" />
               <div className="w-36 h-36 bg-indigo-600/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_80px_rgba(79,70,229,0.15)] group transition-all duration-700 hover:scale-110 hover:border-indigo-500/40 cursor-pointer" onClick={startSession}>
                  <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m8 0h-3m4-12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
               </div>
            </div>
            <h3 className="text-4xl font-outfit font-bold text-white mb-2 text-center tracking-tighter">Tigest AI</h3>
            <p className="text-white/20 text-[10px] uppercase tracking-[0.4em] font-bold">Intelligent Voice Agent</p>
          </div>
          <Controls status={status} onStart={startSession} onStop={stopSession} />
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col animate-in fade-in duration-500">
          <div className="flex-1 flex flex-col items-center justify-center pt-16">
            <Avatar 
              isAgentSpeaking={isAgentSpeaking} 
              isUserSpeaking={isUserSpeaking} 
              isConnecting={status === ConnectionStatus.CONNECTING} 
            />

            <div className="text-center h-20 flex flex-col justify-center">
              {activeTool ? (
                <div className="flex flex-col items-center animate-pulse text-indigo-400">
                  <div className="text-[10px] font-mono uppercase tracking-[0.5em] mb-2 font-black">Syncing Knowledge</div>
                  <div className="text-white/40 text-[11px]">Updating leads...</div>
                </div>
              ) : (
                <>
                  <h3 className="text-3xl font-outfit font-bold text-white mb-1 tracking-tighter">
                    {status === ConnectionStatus.CONNECTING ? "Connecting..." : (isAgentSpeaking ? "Tigest AI" : (isUserSpeaking ? "Listening..." : "Ready to Talk"))}
                  </h3>
                  <p className="text-white/20 text-[10px] uppercase tracking-[0.4em] font-black">
                    {status === ConnectionStatus.CONNECTING ? "Establishing Secure Link" : "Voice Stream Active"}
                  </p>
                </>
              )}
            </div>
            
            <div className="w-full px-12 mt-8">
               <Visualizer isActive={status === ConnectionStatus.CONNECTED} color={isAgentSpeaking ? "#818cf8" : (isUserSpeaking ? "#ffffff" : "#4f46e5")} />
            </div>
          </div>

          <TranscriptBox 
            transcript={transcriptState} 
            liveUser={liveTranscript.user} 
            liveAgent={liveTranscript.agent} 
          />

          <Controls status={status} onStart={startSession} onStop={stopSession} />
        </div>
      )}
    </div>
  );
};

export default VoiceAgent;
