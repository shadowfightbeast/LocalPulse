import { useState, useRef } from 'react';
import axios from 'axios';
import { Terminal, Zap, Cpu, ShieldCheck, Search, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

function UploadPanel() {
  const [status, setStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const uploadFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['md', 'log', 'txt'].includes(ext)) {
      setStatus('error');
      setMessage('Only .md, .log, or .txt files are supported.');
      return;
    }
    setStatus('uploading');
    setMessage('');
    const form = new FormData();
    form.append('file', file);
    try {
      const resp = await axios.post(`${API_BASE}/upload-file`, form);
      const d = resp.data;
      setStatus('success');
      setMessage(`Indexed ${d.chunks} chunks from "${d.file}" as ${d.source_type}.`);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'Upload failed.');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-accent" />
        <h2 className="font-semibold">Add to Knowledge Base</h2>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          dragOver ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
        )}
      >
        <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400 font-medium">Drop a file or click to browse</p>
        <p className="text-xs text-slate-600 mt-1">.md runbooks · .log error files · .txt dumps</p>
        <input
          ref={inputRef}
          type="file"
          accept=".md,.log,.txt"
          className="hidden"
          onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0])}
        />
      </div>

      {/* Status */}
      {status === 'uploading' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Indexing file...
        </div>
      )}
      {status === 'success' && (
        <div className="mt-3 flex items-start gap-2 text-sm text-success">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{message} Searchable immediately — no restart needed.</span>
        </div>
      )}
      {status === 'error' && (
        <div className="mt-3 flex items-start gap-2 text-sm text-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      <p className="text-xs text-slate-600 mt-3">
        Files are saved to <span className="font-mono">data/sources/</span> and re-indexed on server restart too.
      </p>
    </section>
  );
}

export default function InputSection({ query, setQuery, topK, setTopK, handleDiagnose, loading }) {
  return (
    <div className="lg:col-span-4 space-y-6">

      {/* Query input */}
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
              <div className="bg-slate-800 px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-400 border border-white/5">UTF-8</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-400 font-medium">Retrieval Depth</label>
            <div className="flex items-center gap-4">
              <input type="range" min="1" max="8" value={topK} onChange={(e) => setTopK(parseInt(e.target.value))} className="w-24 accent-primary" />
              <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded border border-white/5">{topK}</span>
            </div>
          </div>

          <button
            onClick={handleDiagnose}
            disabled={loading}
            className={cn(
              "w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]",
              loading ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-primary text-white hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] shadow-lg shadow-primary/20"
            )}
          >
            {loading
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
              : <><Zap className="w-5 h-5 fill-current" />Diagnose Incident</>
            }
          </button>
        </div>
      </section>

      {/* File upload */}
      <UploadPanel />

      {/* Local stack info */}
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
