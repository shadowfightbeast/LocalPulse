import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 mt-12 relative z-10">
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
  );
}
