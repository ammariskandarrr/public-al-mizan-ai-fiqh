import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, AlertCircle, Sparkles, Brain, Database, Zap } from 'lucide-react';
import { fetchRelevantContext, generateSystemInstruction, KnowledgeContext } from '../services/knowledgeService';

interface SessionMemory {
  conversationHistory: Array<{ role: string; content: string }>;
  userIntent: string;
  contextLoaded: boolean;
}

const LiveConsultant: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextStatus, setContextStatus] = useState<string>('');
  const [sessionMemory, setSessionMemory] = useState<SessionMemory>({
    conversationHistory: [],
    userIntent: '',
    contextLoaded: false
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const loadedContextsRef = useRef<KnowledgeContext[]>([]);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0); // Track when next audio chunk should play
  const activeAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]); // Track active audio sources for interruption

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setIsLoadingContext(true);
    setContextStatus('Initializing session...');

    try {
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        }
      });
      streamRef.current = stream;

      // Setup audio analyzer for volume visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Start volume monitoring
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current || !isConnected) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(average / 255);
        requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Load initial context
      setContextStatus('Loading Islamic Finance knowledge base...');
      const initialContexts = await fetchRelevantContext('Islamic Finance general principles and Shariah compliance', 3);
      loadedContextsRef.current = initialContexts;

      // Generate system instruction
      const systemInstruction = generateSystemInstruction(initialContexts);

      setContextStatus('Connecting to AI consultant...');

      // Connect to OpenAI Realtime API
      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
        ['realtime', `openai-insecure-api-key.${import.meta.env.VITE_OPENAI_API_KEY}`]
      );

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to OpenAI Realtime API');

        // Configure session (GA API format - corrected)
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            type: 'realtime',
            model: 'gpt-realtime',
            instructions: systemInstruction,
            audio: {
              input: {
                format: {
                  type: 'audio/pcm',
                  rate: 24000
                }
              },
              output: {
                format: {
                  type: 'audio/pcm',
                  rate: 24000
                },
                voice: 'alloy'
              }
            }
          }
        }));

        setIsConnected(true);
        setIsConnecting(false);
        setIsLoadingContext(false);
        setContextStatus('');

        setSessionMemory(prev => ({
          ...prev,
          contextLoaded: true
        }));

        // Create ScriptProcessor for proper PCM16 audio encoding
        const scriptProcessor = audioContextRef.current!.createScriptProcessor(2048, 1, 1);
        scriptProcessorRef.current = scriptProcessor;
        const micSource = audioContextRef.current!.createMediaStreamSource(stream);

        micSource.connect(scriptProcessor);
        scriptProcessor.connect(audioContextRef.current!.destination);

        let audioChunkCount = 0;
        scriptProcessor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32 to PCM16
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Convert to base64
          const bytes = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Audio = btoa(binary);

          // Log audio sending (every 50 chunks to avoid spam)
          audioChunkCount++;
          if (audioChunkCount % 50 === 0) {
            console.log(`📤 Sent ${audioChunkCount} audio chunks to OpenAI (${bytes.byteLength} bytes each)`);
          }

          // Send to OpenAI
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        };
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        // Log all incoming events (except audio deltas to avoid spam)
        if (!data.type.includes('.delta')) {
          console.log('📥 Received event:', data.type, data);
        }

        switch (data.type) {
          case 'response.output_audio.delta':
            // Receive audio chunks from AI (GA API event name)
            console.log('🔊 Receiving AI audio chunk...');
            if (data.delta && audioContextRef.current) {
              try {
                // Decode base64 to PCM16
                const binaryString = atob(data.delta);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }

                // Convert PCM16 to Float32
                const int16Array = new Int16Array(bytes.buffer);
                const float32Array = new Float32Array(int16Array.length);
                for (let i = 0; i < int16Array.length; i++) {
                  float32Array[i] = int16Array[i] / 32768.0;
                }

                // Create and play audio buffer with proper timing
                const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
                audioBuffer.getChannelData(0).set(float32Array);

                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);

                // Schedule playback to avoid overlaps
                const currentTime = audioContextRef.current.currentTime;
                const startTime = Math.max(currentTime, nextPlayTimeRef.current);
                // Track active source for cancellation
                source.onended = () => {
                  activeAudioSourcesRef.current = activeAudioSourcesRef.current.filter(s => s !== source);
                };
                activeAudioSourcesRef.current.push(source);

                source.start(startTime);

                // Update next play time
                nextPlayTimeRef.current = startTime + audioBuffer.duration;

                console.log(`🔊 Playing audio chunk at ${startTime.toFixed(2)}s (duration: ${audioBuffer.duration.toFixed(3)}s)`);
              } catch (err) {
                console.error('Error playing audio:', err);
              }
            }
            break;

          case 'conversation.item.input_audio_transcription.completed':
            // User's speech transcribed
            const userText = data.transcript;
            console.log('🎤 USER SAID:', userText);

            setSessionMemory(prev => {
              const newHistory = [...prev.conversationHistory, { role: 'user', content: userText }];
              // Keep only last 4 turns (User + Assistant = 1 turn approx, so let's keep 8 items max)
              return {
                ...prev,
                conversationHistory: newHistory.slice(-8)
              };
            });

            // Dynamically load more context if needed
            if (userText && userText.length > 10) {
              fetchRelevantContext(userText, 2).then(additionalContexts => {
                if (additionalContexts.length > 0) {
                  // Filter out duplicates based on source or content content
                  const existingSources = new Set(loadedContextsRef.current.map(c => c.source + c.content.substring(0, 20)));
                  const newUnique = additionalContexts.filter(c => !existingSources.has(c.source + c.content.substring(0, 20)));

                  if (newUnique.length > 0) {
                    loadedContextsRef.current = [...loadedContextsRef.current, ...newUnique];
                    console.log('Loaded additional context based on query');

                    // Update the active session with new knowledge
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      const updatedInstructions = generateSystemInstruction(loadedContextsRef.current);
                      wsRef.current.send(JSON.stringify({
                        type: 'session.update',
                        session: {
                          instructions: updatedInstructions
                        }
                      }));
                      console.log('🔄 Updated session instructions with new context');
                    }
                  }
                }
              });
            }
            break;

          case 'response.output_text.delta':
            // AI's text response (for logging) - GA API event name
            console.log('💬 AI TEXT:', data.delta);
            break;



          case 'input_audio_buffer.speech_started':
            console.log('🎙️ Speech detected - User started speaking, stopping AI audio...');

            // Interrupt: Stop all currently playing audio immediately
            activeAudioSourcesRef.current.forEach(source => {
              try {
                source.stop();
              } catch (err) {
                // Ignore errors if source already stopped
              }
            });
            activeAudioSourcesRef.current = [];

            // Reset timing buffer so new response starts fresh
            if (audioContextRef.current) {
              nextPlayTimeRef.current = audioContextRef.current.currentTime;
            }

            // Also explicitly send a cancel event to server to stop generation if needed
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'response.cancel'
              }));
            }
            break;

          case 'input_audio_buffer.speech_stopped':
            console.log('⏸️ Speech stopped - Processing...');
            break;

          case 'response.created':
            console.log('🤖 AI is generating response...');
            // Reset audio timing for new response
            if (audioContextRef.current) {
              nextPlayTimeRef.current = audioContextRef.current.currentTime;
            }
            break;

          case 'response.done':
            console.log('✅ AI Response completed');
            // Response completed
            const assistantText = data.response?.output?.[0]?.content?.[0]?.text || '';
            if (assistantText) {
              setSessionMemory(prev => {
                const newHistory = [...prev.conversationHistory, { role: 'assistant', content: assistantText }];
                return {
                  ...prev,
                  conversationHistory: newHistory.slice(-8)
                };
              });
            }
            break;

          case 'error':
            console.error('Realtime API error:', data.error);
            console.error('Full error object:', JSON.stringify(data, null, 2));
            setError(data.error?.message || 'An error occurred');
            break;
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error. Please try again.');
        stopSession();
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
      };

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Microphone access denied or service unavailable.');
      setIsConnecting(false);
      setIsLoadingContext(false);
      stopSession();
    }
  };

  const stopSession = () => {
    // Disconnect ScriptProcessor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    wsRef.current?.close();
    wsRef.current = null;

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    setIsConnected(false);
    setIsConnecting(false);
    setVolume(0);
    setIsLoadingContext(false);
    setContextStatus('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-[2.5rem] relative overflow-hidden text-white shadow-2xl bg-[#0F172A]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse-slow delay-1000"></div>
        {isConnected && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl animate-ping-slow duration-[3000ms]"></div>}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-8">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : 'bg-red-500/50'}`}></div>
          <span className="text-sm font-medium tracking-wide opacity-80 uppercase">{isConnected ? 'Live Session Active' : 'Session Inactive'}</span>
        </div>

      </div>

      {/* Main Visualizer Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 space-y-12">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-white leading-tight">
            {isLoadingContext ? "Loading Knowledge..." : isConnected ? "Listening..." : "AI Shariah Consultant"}
          </h2>
          <p className="text-lg text-slate-300 font-light max-w-sm mx-auto">
            {isLoadingContext
              ? contextStatus
              : isConnected
                ? "Speak naturally. I am listening to your query."
                : "Tap below to start a secure voice consultation with your Shariah Advisor."}
          </p>
        </div>

        {/* Context Indicators */}
        {sessionMemory.contextLoaded && isConnected && (
          <div className="flex gap-3 flex-wrap justify-center max-w-2xl">
            <div className="bg-blue-500/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-500/20 text-xs flex items-center gap-2">
              <Database size={12} className="text-blue-400" />
              <span>{loadedContextsRef.current.length} Knowledge Sources Loaded</span>
            </div>
            <div className="bg-purple-500/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-500/20 text-xs flex items-center gap-2">
              <Brain size={12} className="text-purple-400" />
              <span>{sessionMemory.conversationHistory.length} Exchanges</span>
            </div>
            <div className="bg-green-500/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-500/20 text-xs flex items-center gap-2">
              <Zap size={12} className="text-green-400" />
              <span>VAD Active</span>
            </div>
          </div>
        )}

        {/* Central Orb / Visualizer */}
        <div className="relative w-64 h-64 flex items-center justify-center group">
          {isConnected && (
            <>
              {/* Outer Ripples */}
              <div className="absolute inset-0 rounded-full border border-blue-500/30 scale-110 animate-[spin_10s_linear_infinite] opacity-50"></div>
              <div className="absolute inset-0 rounded-full border border-indigo-500/20 scale-125 animate-[spin_15s_linear_infinite_reverse] opacity-40"></div>

              {/* Volume Reactivity */}
              <div
                className="absolute inset-0 bg-blue-500/30 rounded-full blur-3xl transition-transform duration-75 ease-out"
                style={{ transform: `scale(${1 + volume * 3})` }}
              ></div>
            </>
          )}

          {/* Main Button Container */}
          <div className="relative z-20">
            {isConnecting || isLoadingContext ? (
              <div className="w-24 h-24 rounded-full border-4 border-white/20 border-t-blue-500 animate-spin"></div>
            ) : !isConnected ? (
              <button
                onClick={startSession}
                className="w-24 h-24 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_60px_rgba(59,130,246,0.5)]"
              >
                <Mic size={32} className="text-white group-hover:text-blue-400 transition-colors" />
              </button>
            ) : (
              <button
                onClick={stopSession}
                className="w-24 h-24 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
              >
                <X size={32} className="text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Status / Error Message */}
        <div className="h-12 flex items-center justify-center">
          {error && (
            <div className="flex items-center gap-2 text-red-300 bg-red-900/30 px-4 py-2 rounded-xl backdrop-blur-sm border border-red-500/20 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {isConnected && !error && (
            <div className="flex gap-1 items-center justify-center h-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="w-1 bg-blue-400 rounded-full animate-music-bar"
                  style={{
                    height: `${Math.max(10, volume * 100 * (Math.random() + 0.5))}px`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="relative z-10 p-6 text-center text-xs text-slate-500/60 font-medium uppercase tracking-widest">
        Secure End-to-End Voice Encryption • Powered by Al-Mizan Intelligence
      </div>
    </div>
  );
};

export default LiveConsultant;