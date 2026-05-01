import React from 'react';
import { Search, AlertTriangle, CheckCircle2, History } from 'lucide-react';

export default function ResultSection({ result, loading, error }) {
  if (!result && !loading && !error) {
    return (
      <div className="lg:col-span-8 space-y-6">
        <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <Search className="w-10 h-10 text-primary/40" />
          </div>
          <div className="max-w-sm">
            <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
            <p className="text-slate-500">Paste your error log in the terminal and click diagnose to begin retrieval-augmented debugging.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-8 space-y-6">
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
  );
}
