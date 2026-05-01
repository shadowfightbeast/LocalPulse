import React from 'react';
import { Terminal, Zap, Cpu, ShieldCheck, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function InputSection({ query, setQuery, topK, setTopK, handleDiagnose, loading }) {
  return (
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
  );
}
