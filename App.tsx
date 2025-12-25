
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Features from './components/Features';
import VoiceAgent from './components/VoiceAgent';

const FORM_WEBHOOK_URL = "https://kunaal-n8n-app.proudsmoke-84fb7068.northeurope.azurecontainerapps.io/webhook/landing-page-form";

const App: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', website: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      // FIXED JSON SCHEMA FOR FORM SUBMISSION
      const payload = {
        name: formData.name,
        email: formData.email,
        website: formData.website,
        message: formData.message,
        source: 'Landing Page Form',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(FORM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) { 
        setFormStatus('success');
        setFormData({ name: '', email: '', website: '', message: '' });
      } else {
        setFormStatus('error');
      }
    } catch (err) {
      setFormStatus('error');
    }
  };

  const scrollToForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen selection:bg-indigo-500/30 overflow-x-hidden bg-[#050505] text-white">
      <Header />
      
      <main>
        <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[700px] bg-indigo-600/5 blur-[150px] rounded-full -z-10 pointer-events-none" />
          
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] uppercase tracking-widest font-bold mb-10">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>Now Powered by Gemini 3 Pro</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-outfit font-bold leading-[0.9] mb-10 tracking-tighter">
                Talk to the <br />
                <span className="bg-gradient-to-r from-indigo-400 via-white to-purple-400 bg-clip-text text-transparent italic">Future.</span>
              </h1>
              <p className="text-xl text-white/40 mb-12 max-w-lg leading-relaxed font-light">
                Automate your receptionist, capture 100% of inbound leads, and schedule appointments with our ultra-low latency native voice AI.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={scrollToForm}
                  className="w-full sm:w-auto px-8 py-5 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all active:scale-[0.98] shadow-2xl shadow-white/10"
                >
                  Launch Your Agent
                </button>
                <div className="flex items-center space-x-3 text-white/30 text-sm">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050505] bg-white/10" />)}
                  </div>
                  <span>Joined by 40+ local businesses</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end relative animate-in fade-in slide-in-from-right-8 duration-1000">
              <VoiceAgent />
            </div>
          </div>
        </section>

        <section className="py-24 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-white/20 text-[10px] uppercase tracking-[0.5em] mb-16 font-bold">Powering Modern Operations At</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-12 md:gap-8 items-center justify-items-center opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
               <div className="text-xl font-outfit font-black tracking-tighter">STELLAR.</div>
               <div className="text-2xl font-serif italic tracking-tight">Oasis</div>
               <div className="text-lg font-bold uppercase tracking-[0.2em]">Vertex</div>
               <div className="text-xl font-light tracking-[0.4em]">AETHER</div>
               <div className="text-2xl font-outfit font-bold lowercase">nova.house</div>
            </div>
          </div>
        </section>

        <Features />

        <section id="case-studies" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-outfit font-bold text-white mb-6 tracking-tight">Real Businesses. Real ROI.</h2>
            <p className="text-white/40 font-light leading-relaxed">Our AI agents don't just talk—they deliver measurable growth for local service-based companies.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="group p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] transition-all hover:from-indigo-500/20">
              <div className="h-full p-12 bg-[#0a0a0a] rounded-[2.8rem] border border-white/5">
                <div className="text-indigo-400 font-mono text-xs tracking-widest uppercase mb-6">Auto Dealership</div>
                <h3 className="text-3xl font-bold text-white mb-8 leading-snug">"24/7 lead capture boosted test-drive volume by 45%."</h3>
                <div className="flex gap-8">
                  <div>
                    <div className="text-2xl font-bold text-white">$12k</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Cost Saved/mo</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold text-white">350+</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Leads/mo</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="group p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] transition-all hover:from-purple-500/20">
              <div className="h-full p-12 bg-[#0a0a0a] rounded-[2.8rem] border border-white/5">
                <div className="text-purple-400 font-mono text-xs tracking-widest uppercase mb-6">Medical Spa</div>
                <h3 className="text-3xl font-bold text-white mb-8 leading-snug">"Instant scheduling reduced front-desk churn by 60%."</h3>
                <div className="flex gap-8">
                  <div>
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Call Coverage</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold text-white">2.5x</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Booking Speed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact-form" className="py-40 px-6">
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full -z-10" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/5 blur-[100px] rounded-full -z-10" />
            
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-8 md:p-20 shadow-2xl overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-[shimmer_3s_infinite]" />
               
               {formStatus === 'success' ? (
                 <div className="text-center py-12 animate-in fade-in zoom-in duration-700">
                   <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-10">
                     <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <h2 className="text-4xl font-outfit font-bold text-white mb-4">You're on the list.</h2>
                   <p className="text-white/40 max-w-sm mx-auto leading-relaxed">Our implementation specialist will reach out to schedule your agent deployment within 24 hours.</p>
                   <button onClick={() => setFormStatus('idle')} className="mt-12 text-indigo-400 text-sm font-bold hover:underline">Send another request</button>
                 </div>
               ) : (
                 <>
                   <div className="text-center mb-16">
                     <h2 className="text-5xl font-outfit font-bold text-white mb-6 tracking-tighter">Scale Your Voice.</h2>
                     <p className="text-white/40 font-light max-w-md mx-auto">Fill in the details below and we'll build a custom demo for your business type.</p>
                   </div>
                   
                   <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                       <label className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] ml-1">Company Name</label>
                       <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all" placeholder="Grand Motors Ltd." />
                     </div>
                     <div className="space-y-3">
                       <label className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] ml-1">Contact Email</label>
                       <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all" placeholder="founder@business.com" />
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <label className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] ml-1">Business Website</label>
                       <input required type="text" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all" placeholder="https://yourwebsite.com" />
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <label className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] ml-1">Primary Goal</label>
                       <textarea rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all resize-none" placeholder="I want to automate outbound service reminders for car owners..." />
                     </div>
                     {formStatus === 'error' && (
                       <div className="md:col-span-2 text-red-500 text-sm text-center">Something went wrong. Please try again later.</div>
                     )}
                     <button type="submit" disabled={formStatus === 'loading'} className="md:col-span-2 py-6 bg-white text-black font-black text-lg rounded-2xl transition-all shadow-2xl shadow-white/5 active:scale-[0.98] flex items-center justify-center group overflow-hidden relative">
                       {formStatus === 'loading' ? (
                         <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                       ) : (
                         <span className="relative z-10 flex items-center">
                           Submit Requirements
                           <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                           </svg>
                         </span>
                       )}
                     </button>
                   </form>
                 </>
               )}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-2xl font-outfit font-bold text-white tracking-tighter">NovaVoice AI</span>
            </div>
            <p className="text-white/10 text-[10px] font-mono">© 2024 NovaVoice AI // Built for Performance</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
