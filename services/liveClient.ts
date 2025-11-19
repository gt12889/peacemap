import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";

const API_KEY = process.env.API_KEY as string;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface LiveClientState {
    isConnected: boolean;
    isSpeaking: boolean;
    error: string | null;
}

export class LiveClient {
    private session: any = null;
    private inputContext: AudioContext | null = null;
    private outputContext: AudioContext | null = null;
    private inputSource: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private nextStartTime: number = 0;
    private audioQueue: AudioBufferSourceNode[] = [];
    private onStateChange: (state: LiveClientState) => void;
    private currentState: LiveClientState = { isConnected: false, isSpeaking: false, error: null };

    constructor(onStateChange: (state: LiveClientState) => void) {
        this.onStateChange = onStateChange;
    }

    private updateState(partial: Partial<LiveClientState>) {
        this.currentState = { ...this.currentState, ...partial };
        this.onStateChange(this.currentState);
    }

    async connect() {
        try {
            this.updateState({ error: null });
            
            // Initialize Audio Contexts
            this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const config = {
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }, // Deep voice for "Commander" feel
                    },
                    systemInstruction: "You are 'Overwatch', a military intelligence AI component of the GeoConflict system. Your demeanor is precise, calm, and strategic. You provide situation reports (SITREPs) and tactical analysis on global conflicts. Use military terminology where appropriate (e.g., 'Copy', 'Roger', 'Sector'). Keep responses concise and actionable.",
                },
            };

            const sessionPromise = ai.live.connect({
                model: config.model,
                config: config.config,
                callbacks: {
                    onopen: () => {
                        this.updateState({ isConnected: true });
                        this.startInputStream(stream, sessionPromise);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        this.handleMessage(message);
                    },
                    onclose: () => {
                        this.disconnect();
                    },
                    onerror: (err) => {
                        console.error("Live API Error:", err);
                        this.updateState({ error: "Connection lost" });
                        this.disconnect();
                    }
                }
            });

        } catch (error: any) {
            this.updateState({ error: error.message || "Failed to connect" });
        }
    }

    private startInputStream(stream: MediaStream, sessionPromise: Promise<any>) {
        if (!this.inputContext) return;

        this.inputSource = this.inputContext.createMediaStreamSource(stream);
        this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = this.createBlob(inputData);
            
            sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        };

        this.inputSource.connect(this.processor);
        this.processor.connect(this.inputContext.destination);
    }

    private async handleMessage(message: LiveServerMessage) {
        const audioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioString && this.outputContext) {
            this.updateState({ isSpeaking: true });
            
            // Ensure start time is at least current time
            this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);

            const audioBuffer = await this.decodeAudioData(
                this.decode(audioString),
                this.outputContext,
                24000,
                1
            );

            const source = this.outputContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputContext.destination);
            
            source.addEventListener('ended', () => {
                // Simple heuristic: if queue is effectively empty (time passed), we stopped speaking
                if (this.outputContext && this.outputContext.currentTime >= this.nextStartTime) {
                     this.updateState({ isSpeaking: false });
                }
            });

            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.audioQueue.push(source);
        }

        if (message.serverContent?.interrupted) {
            this.stopAudioQueue();
            this.updateState({ isSpeaking: false });
        }
    }

    private stopAudioQueue() {
        this.audioQueue.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        this.audioQueue = [];
        this.nextStartTime = 0;
    }

    disconnect() {
        this.stopAudioQueue();
        
        if (this.inputSource) this.inputSource.disconnect();
        if (this.processor) this.processor.disconnect();
        
        if (this.inputContext) this.inputContext.close();
        if (this.outputContext) this.outputContext.close();

        this.inputContext = null;
        this.outputContext = null;
        this.updateState({ isConnected: false, isSpeaking: false });
    }

    // --- Audio Utilities ---

    private createBlob(data: Float32Array): Blob {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: this.encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    private encode(bytes: Uint8Array) {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    private async decodeAudioData(
        data: Uint8Array,
        ctx: AudioContext,
        sampleRate: number,
        numChannels: number
    ): Promise<AudioBuffer> {
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
    }
}
