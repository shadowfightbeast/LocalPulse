import React from 'react';
import { ShieldCheck, Settings } from 'lucide-react';

export default function Header() {
  return (
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
  );
}
