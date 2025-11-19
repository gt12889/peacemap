import React, { useEffect, useRef, useState } from 'react';
import { LiveClient, LiveClientState } from '../services/liveClient';
import { Mic, Power, Activity, Cpu, Wifi, Radio, Zap } from 'lucide-react';

const LiveCommand: React.FC = () => {
    const [state, setState] = useState<LiveClientState>({ isConnected: false, isSpeaking: false, error: null });
    const clientRef = useRef<LiveClient | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        clientRef.current = new LiveClient((newState) => {
            setState(prev => ({ ...prev, ...newState }));
        });
        return () => {
            clientRef.current?.disconnect();
        };
    }, []);

    const toggleConnection = () => {
        if (state.isConnected) {
            clientRef.current?.disconnect();
        } else {
            clientRef.current?.connect();
        }
    };

    // Simulated GPU Audio Visualizer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            if (!canvas || !ctx) return;
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
            for (let i = 0; i < canvas.height; i += 20) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            if (state.isConnected) {
                // Active visualization
                const time = Date.now() / 100;
                const amplitude = state.isSpeaking ? 80 : 20;
                const frequency = state.isSpeaking ? 0.1 : 0.05;
                
                ctx.strokeStyle = state.isSpeaking ? '#ef4444' : '#10b981'; // Red for AI, Green for Standby
                ctx.lineWidth = 2;
                ctx.beginPath();

                for (let x = 0; x < canvas.width; x++) {
                    const y = centerY + Math.sin(x * frequency + time) * amplitude * Math.sin(x * 0.01);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // "Particles"
                if (state.isSpeaking) {
                    ctx.fillStyle = '#ef4444';
                    for(let i=0; i<5; i++) {
                        const rx = Math.random() * canvas.width;
                        const ry = centerY + (Math.random() - 0.5) * 100;
                        ctx.fillRect(rx, ry, 2, 2);
                    }
                }

            } else {
                // Offline static
                ctx.fillStyle = '#1f2937';
                ctx.font = '12px monospace';
                ctx.fillText("SYSTEM OFFLINE // WAITING FOR UPLINK", centerX - 120, centerY);
            }

            // Scanline effect
            const scanY = (Date.now() / 10) % canvas.height;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(0, scanY, canvas.width, 2);

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(animationRef.current);
    }, [state.isConnected, state.isSpeaking]);

    return (
        <div className="h-full w-full bg-black p-4 lg:p-8 flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
                
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <Radio className={state.isConnected ? "text-green-500 animate-pulse" : "text-zinc-600"} size={20} />
                        <div>
                            <h2 className="text-sm font-bold tracking-widest text-white uppercase">Overwatch Link</h2>
                            <p className="text-[10px] text-zinc-500 font-mono">SECURE CHANNEL // END-TO-END ENCRYPTED</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs font-mono text-zinc-400">{state.isConnected ? "ONLINE" : "OFFLINE"}</span>
                    </div>
                </div>

                {/* Visualizer */}
                <div className="relative h-64 w-full bg-black">
                    <canvas 
                        ref={canvasRef} 
                        width={800} 
                        height={300} 
                        className="w-full h-full object-cover opacity-80"
                    />
                    
                    {/* Overlay Stats */}
                    <div className="absolute top-4 left-4 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <Cpu size={12} />
                            <span>GPU ACCEL: ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <Wifi size={12} />
                            <span>LATENCY: {state.isConnected ? '12ms' : '--'}</span>
                        </div>
                         <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <Zap size={12} />
                            <span>THREAD: MAIN</span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 bg-zinc-900/30 flex flex-col items-center gap-4">
                    <p className="text-xs text-zinc-400 text-center max-w-md leading-relaxed">
                        Establish a real-time voice link with the Overwatch AI system for tactical briefings and scenario analysis.
                        <br/><span className="text-zinc-600 text-[10px]">Requires microphone access. Data processed via WebRTC stream.</span>
                    </p>

                    {state.error && (
                        <div className="text-red-500 text-xs font-mono border border-red-900/50 bg-red-900/10 px-3 py-1 rounded">
                            ERROR: {state.error}
                        </div>
                    )}

                    <button
                        onClick={toggleConnection}
                        className={`
                            group relative px-8 py-4 rounded-lg font-bold tracking-wider uppercase transition-all duration-300 overflow-hidden
                            ${state.isConnected 
                                ? 'bg-red-900/20 text-red-500 border border-red-900 hover:bg-red-900/40' 
                                : 'bg-emerald-900/20 text-emerald-500 border border-emerald-900 hover:bg-emerald-900/40'
                            }
                        `}
                    >
                        <div className="flex items-center gap-3 z-10 relative">
                            {state.isConnected ? <Power size={18} /> : <Mic size={18} />}
                            <span>{state.isConnected ? "Terminate Uplink" : "Initiate Voice Link"}</span>
                        </div>
                        {/* Button scanline effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveCommand;