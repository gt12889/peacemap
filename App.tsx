import React, { useState, useCallback, useEffect } from 'react';
import { LayoutDashboard, Map as MapIcon, Search, Sparkles, AlertCircle, Loader2, Terminal, Menu, X, Radio } from 'lucide-react';
import ConflictMap from './components/Map';
import Analytics from './components/Analytics';
import LiveCommand from './components/LiveCommand';
import { analyzeConflicts } from './services/geminiService';
import { ConflictEvent, AnalysisResult } from './types';

const INITIAL_QUERY = "Recent conflict events in the Sahel region";

const App: React.FC = () => {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'live'>('map');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await analyzeConflicts(query);
      setAnalysisData(result);
    } catch (err) {
      setError("Failed to analyze conflict data. Please check your API key or try a different query.");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // Initial load
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Terminal size={20} className="text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg tracking-tight">GeoConflict AI</h1>
                <p className="text-xs text-zinc-500">Intel & Analysis</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Query Section */}
            <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Intelligence Query
                </label>
                <form onSubmit={handleSearch} className="relative">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Describe region or conflict..."
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                    <Search className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 top-2 p-1.5 bg-zinc-800 hover:bg-indigo-600 rounded-md text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                </form>
                <p className="text-[10px] text-zinc-600">
                    Try: "Civil unrest in France", "Cartel violence in Mexico", "Insurgency in Sahel 2024"
                </p>
            </div>

            {/* Analysis Result Section */}
            {analysisData && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                    
                    {/* Status Card */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-900 border border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-zinc-400">THREAT LEVEL</span>
                            <span className={`
                                px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                                ${analysisData.trend === 'escalating' ? 'bg-red-950/50 border-red-900 text-red-400' : ''}
                                ${analysisData.trend === 'volatile' ? 'bg-orange-950/50 border-orange-900 text-orange-400' : ''}
                                ${analysisData.trend === 'stable' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' : ''}
                                ${analysisData.trend === 'de-escalating' ? 'bg-blue-950/50 border-blue-900 text-blue-400' : ''}
                            `}>
                                {analysisData.trend}
                            </span>
                        </div>
                        <div className="space-y-2">
                             <h3 className="text-sm font-medium text-zinc-200">Executive Summary</h3>
                             <p className="text-xs text-zinc-400 leading-relaxed">
                                {analysisData.summary}
                             </p>
                        </div>
                    </div>

                    {/* Actors */}
                    <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Key Actors</h4>
                        <div className="flex flex-wrap gap-2">
                            {analysisData.keyActors.map((actor, i) => (
                                <span key={i} className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-300">
                                    {actor}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Event List (Compact) */}
                     <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Recent Events</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {analysisData.events.slice(0, 5).map((event) => (
                                <div key={event.id} className="p-3 bg-zinc-900/50 rounded border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase ${event.type === 'Battle' ? 'text-red-400' : 'text-indigo-400'}`}>
                                            {event.type}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">{event.date}</span>
                                    </div>
                                    <p className="text-xs text-zinc-300 line-clamp-2">{event.description}</p>
                                </div>
                            ))}
                             {analysisData.events.length > 5 && (
                                <p className="text-[10px] text-center text-zinc-500 italic">
                                    + {analysisData.events.length - 5} more events on map
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
             {/* Error State */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-3">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{error}</p>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 text-[10px] text-zinc-600 text-center">
            Simulated data powered by Gemini AI
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        
        {/* Top Nav (Mobile toggle & Tabs) */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden pointer-events-auto p-2 bg-zinc-900/90 backdrop-blur text-zinc-300 rounded-lg border border-zinc-800 shadow-lg"
            >
                <Menu size={20} />
            </button>

            <div className="flex bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-1 shadow-xl pointer-events-auto mx-auto lg:mx-0">
                <button
                    onClick={() => setActiveTab('map')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                        activeTab === 'map' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                >
                    <MapIcon size={14} />
                    Live Map
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                        activeTab === 'analytics' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                >
                    <LayoutDashboard size={14} />
                    Analytics
                </button>
                <button
                    onClick={() => setActiveTab('live')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                        activeTab === 'live' 
                        ? 'bg-red-600 text-white shadow-md animate-pulse' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                >
                    <Radio size={14} />
                    Live Ops
                </button>
            </div>
        </div>

        {/* Views */}
        <div className="flex-1 w-full h-full relative">
            {activeTab === 'map' && (
                <div className="w-full h-full animate-in fade-in duration-500">
                     <ConflictMap events={analysisData?.events || []} />
                </div>
            )}
            
            {activeTab === 'analytics' && (
                <div className="w-full h-full bg-zinc-950 p-4 lg:p-8 pt-20 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="max-w-5xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Conflict Analytics</h2>
                            <p className="text-zinc-400 text-sm">Visual breakdown of event types, lethality, and distribution for current query.</p>
                        </div>
                        <Analytics events={analysisData?.events || []} />
                     </div>
                </div>
            )}

             {activeTab === 'live' && (
                <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 pt-20">
                    <LiveCommand />
                </div>
            )}
        </div>

      </main>
    </div>
  );
};

export default App;