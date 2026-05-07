import { useState } from 'react';
import {
  Search, AlertTriangle, CheckCircle2, History,
  ThumbsUp, ThumbsDown, Save, X, Loader2
} from 'lucide-react';

// ── Save Modal ────────────────────────────────────────────────────────────────
function SaveModal({ result, onClose, onSave }) {
  const parsed = result.parsed || {};
  const answerLines = result.answer.split('\n').filter(Boolean);
  const causeLines = answerLines.filter(l => l.toLowerCase().includes('cause'));
  const fixLines = answerLines.filter(l =>
    l.startsWith('-') || l.startsWith('•') || /^\d+\./.test(l)
  );

  const [form, setForm] = useState({
    error: result.query || '',
    root_cause: causeLines.map(l => l.replace(/^.*?:\s*/, '')).join(' ') || '',
    fix: fixLines.join('\n') || answerLines.slice(1).join('\n'),
    tags: parsed.service ? parsed.service.toLowerCase() : '',
    service: parsed.service || '',
    severity: parsed.severity || 'ERROR',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        error: form.error,
        root_cause: form.root_cause,
        fix: form.fix,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        service: form.service,
        severity: form.severity,
      });
      onClose();
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Save failed. Make sure root cause and fix are specific.');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, name, multiline }) => (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
        />
      ) : (
        <input
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-xl shadow-2xl border border-white/10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-primary/10">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">Save to Knowledge Base</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300 leading-relaxed">
            <strong>Review before saving.</strong> The LLM validates each entry — vague or incomplete fixes are automatically rejected to keep the knowledge base accurate.
          </div>

          <Field label="Error / Log" name="error" multiline />
          <Field label="Root Cause (why did this happen?)" name="root_cause" multiline />
          <Field label="Fix (specific steps to resolve)" name="fix" multiline />
          <Field label="Service" name="service" />
          <Field label="Tags (comma-separated)" name="tags" />

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Severity</label>
            <select
              value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            >
              {['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL', 'FATAL'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {saveError && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Validating & Saving...</>
              : <><Save className="w-4 h-4" />Save Incident</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Result Section ────────────────────────────────────────────────────────────
export default function ResultSection({ result, loading, error, savedId, onSaveIncident }) {
  const [showModal, setShowModal] = useState(false);

  if (!result && !loading && !error) {
    return (
      <div className="lg:col-span-8 space-y-6">
        <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <Search className="w-10 h-10 text-primary/40" />
          </div>
          <div className="max-w-sm">
            <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
            <p className="text-slate-500">Paste your error log and click Diagnose to begin retrieval-augmented debugging.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-8 space-y-6">
      {error && (
        <div className="glass border-danger/30 rounded-2xl p-6 flex items-start gap-4 text-danger">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-bold">Execution Error</h3>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">

          {/* Answer card */}
          <div className="glass rounded-2xl overflow-hidden border-primary/20 shadow-2xl shadow-primary/5">
            <div className="bg-primary/10 px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">Intelligence Recommendation</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none mb-1">Confidence</div>
                <div className="text-xl font-mono font-bold text-primary">{result.confidence}%</div>
              </div>
            </div>

            <div className="p-8">
              {/* Answer text */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </div>

              {/* Parsed fields */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(result.parsed || {})
                  .filter(([k]) => k !== 'raw')
                  .map(([key, val], i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">{key}</div>
                      <div className="text-sm font-semibold truncate text-accent">{String(val) || 'N/A'}</div>
                    </div>
                  ))}
              </div>

              {/* Feedback row */}
              <div className="mt-6 pt-6 border-t border-white/5">
                {savedId ? (
                  <div className="flex items-center gap-2 text-success text-sm font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    Saved as <span className="font-mono">{savedId}</span> — knowledge base updated live, no restart needed!
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-400">Did this fix your issue?</span>
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-semibold hover:bg-success/20 transition-all"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Yes — Save to Knowledge Base
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/10 transition-all">
                      <ThumbsDown className="w-4 h-4" />
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Retrieved incidents */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <History className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-400">
                Contextual Grounding
                <span className="font-normal opacity-50 ml-2">({result.retrieved.length} incidents retrieved)</span>
              </h3>
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
                      <span className="text-[10px] font-mono text-slate-500">{inc.score?.toFixed(3)}</span>
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

      {showModal && (
        <SaveModal
          result={result}
          onClose={() => setShowModal(false)}
          onSave={onSaveIncident}
        />
      )}
    </div>
  );
}
