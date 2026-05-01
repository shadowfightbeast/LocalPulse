import React, { useState } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

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

      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <InputSection 
          query={query} 
          setQuery={setQuery} 
          topK={topK} 
          setTopK={setTopK} 
          handleDiagnose={handleDiagnose} 
          loading={loading} 
        />
        
        <ResultSection 
          result={result} 
          loading={loading} 
          error={error} 
        />
      </main>

      <Footer />
    </div>
  );
}

export default App;
