import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Terminal, 
  Search, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Settings,
  History,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_BASE = "http://localhost:8000/api";

function App() {
  const [query, setQuery] = useState("2025-12-02 ERROR PaymentService NullPointerException at line 45");
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDiagnose = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/diagnose`, {
        query,
        top_k: topK
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to connect to the analysis engine. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 selection:bg-primary/30 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Incident Intelligence</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">RAG Analysis Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Engine Online
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <section className="glass rounded-2xl p-6 glow-blue">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Log Analysis</h2>
            </div>
            
            <div className="space-y-4">
              <div className="relative group">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none outline-none"
                  placeholder="Paste your error log or stack trace here..."
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-slate-800 px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-400 border border-white/5">
                    UTF-8
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-400 font-medium">Retrieval Depth</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="8" 
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="w-24 accent-primary"
                  />
                  <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded border border-white/5">{topK}</span>
                </div>
              </div>

              <button 
                onClick={handleDiagnose}
                disabled={loading}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]",
                  loading 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-primary text-white hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] shadow-lg shadow-primary/20"
                )}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    Diagnose Incident
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-accent" />
              <h2 className="font-semibold">Local Stack</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "LLM", value: "Ollama (Llama 3.1)", icon: ShieldCheck },
                { label: "Embeddings", value: "SentenceTransformers", icon: Search },
                { label: "Vector DB", value: "FAISS", icon: Cpu },
                { label: "Retrieval", value: "Hybrid Semantic", icon: Zap },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-slate-400 group-hover:text-accent" />
                    <span className="text-sm font-medium text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-200">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 space-y-6">
          {!result && !loading && !error && (
            <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <Search className="w-10 h-10 text-primary/40" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
                <p className="text-slate-500">Paste your error log in the terminal and click diagnose to begin retrieval-augmented debugging.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="glass border-danger/30 rounded-2xl p-6 flex items-start gap-4 text-danger animate-in slide-in-from-top-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold">Execution Error</h3>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Main Fix Card */}
              <div className="glass rounded-2xl overflow-hidden border-primary/20 shadow-2xl shadow-primary/5">
                <div className="bg-primary/10 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary">Intelligence Recommendation</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none mb-1">Confidence</div>
                      <div className="text-xl font-mono font-bold text-primary">{result.confidence}%</div>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-white leading-tight">
                    {result.answer.split('\n')[0].replace('Likely Root Cause: ', '')}
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 font-medium leading-relaxed">
                      {result.answer}
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(result.parsed || {}).map(([key, val], i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">{key}</div>
                        <div className="text-sm font-semibold truncate text-accent">{val || "N/A"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Retrieved Incidents */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <History className="w-5 h-5 text-slate-500" />
                  <h3 className="font-bold text-slate-400">Contextual Grounding <span className="font-normal opacity-50 ml-2">({result.retrieved.length} incidents retrieved)</span></h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.retrieved.map((inc, i) => (
                    <div key={i} className="glass rounded-xl p-5 hover:border-white/20 transition-all group">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded border border-white/5 text-slate-400">{inc.id}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(inc.score * 100, 100)}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{inc.score.toFixed(3)}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors">{inc.error}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{inc.root_cause}</p>
                      <div className="flex flex-wrap gap-2">
                        {inc.tags?.map((tag, j) => (
                          <span key={j} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Focused Analysis &bull; No logs leave your local network</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
              Documentation <ExternalLink className="w-3 h-3" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
              Support <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
