
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VoiceAgent from './components/VoiceAgent';
import ROICalculator from './components/ROICalculator';

const FORM_WEBHOOK_URL = "https://kunaal-n8n-app.proudsmoke-84fb7068.northeurope.azurecontainerapps.io/webhook/landing-page-form";

const TigestLogo = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="50" cy="50" r="50" fill="black"/>
    <path d="M20 26.5H41V67.5L20 47V26.5Z" fill="white"/>
    <path d="M41 26.5H82V47.5H61.5L41 68V88.5L82 47.5V26.5H41Z" fill="white"/>
    <path d="M41 26.5L61.5 47.5H41V26.5Z" fill="black" fillOpacity="0.3"/>
  </svg>
);

const LOGOS = [
  { name: 'Gemini', color: '#8E75FF', icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 mr-3" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>) },
  { name: 'n8n', color: '#FF6D5A', icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 mr-3" fill="currentColor"><path d="M12 2L2 12L12 22L22 12L12 2ZM12 18L6 12L12 6L18 12L12 18Z"/></svg>) },
  { name: 'HubSpot', color: '#FF7A59', icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 mr-3" fill="currentColor"><path d="M18.8 10.1c-1.1-.4-2.3-.6-3.4-.6-.8 0-1.6.1-2.4.4v-1c.6-.3 1-.9 1-1.6 0-1-.8-1.8-1.8-1.8s-1.8.8-1.8 1.8c0 .7.4 1.3 1 1.6v1c-.8-.3-1.6-.4-2.4-.4-1.1 0-2.3.2-3.4.6C2.9 11.2 1 13.9 1 17c0 3.3 2.7 6 6 6s6-2.7 6-6v-1.1c.3.1.6.2.9.2.9 0 1.6-.7 1.6-1.6s-.7-1.6-1.6-1.6c-.3 0-.6.1-.9.2v-1.1c0-3.3 2.7-6 6-6 3.1 0 5.8 1.9 6.9 4.6.4-1.1.2-2.3-.6-3.4z"/></svg>) },
  { name: 'GHL', color: '#1A56FF', icon: (<div className="w-6 h-6 mr-3 bg-[#1A56FF] rounded flex items-center justify-center font-black text-[8px]">GHL</div>) },
  { name: 'Make', color: '#8C3DFF', icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 mr-3" fill="currentColor"><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="17" r="2"/></svg>) },
  { name: 'WhatsApp', color: '#25D366', icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 mr-3" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.436 1.092 3.398l-.715 2.614 2.673-.701a5.728 5.728 0 002.717.656c3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zm3.336 8.204c-.145.41-.735.797-1.012.848-.27.051-.6-.027-1.042-.178a4.34 4.34 0 01-1.921-1.226 4.79 4.79 0 01-1.293-2.022c-.171-.572.015-.884.158-1.027.143-.143.315-.178.421-.178.106 0 .211.001.303.006.101.005.23-.038.359.273.13.315.443 1.077.481 1.155.038.077.064.167.013.269-.051.102-.076.166-.151.253-.075.087-.158.194-.226.259-.077.073-.158.153-.068.307.09.154.4 1.116.858 1.523.587.523 1.082.686 1.236.763.154.077.244.064.334-.038.09-.102.385-.448.487-.601.102-.153.205-.128.346-.077.141.051.897.423 1.051.5.154.077.256.115.294.179.038.064.038.371-.107.781z"/></svg>) },
  { name: 'Sheets', color: '#0F9D58', icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 mr-3" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>) },
  { name: 'Instantly', color: '#3182CE', icon: (<svg viewBox="0 0 24 24" className="w-6 h-6 mr-3" fill="currentColor"><path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/></svg>) }
];

const CLIENTS = [
  "Grand Motors Dealership",
  "Elite Wellness Center",
  "Urban Bistro Group",
  "Prime Dental Clinic",
  "Stellar Real Estate",
  "Zenith Law Firm",
  "Apex Fitness Clubs",
  "Nova Spa & Boutique",
  "Quantum Tech Solutions",
  "Legacy Wealth Management"
];

const App: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', website: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const payload = { ...formData, source: 'Landing Page Form', timestamp: new Date().toISOString() };
      const response = await fetch(FORM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setFormStatus('success');
        setFormData({ name: '', email: '', website: '', message: '' });
      } else { setFormStatus('error'); }
    } catch (err) { setFormStatus('error'); }
  };

  const scrollToForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen selection:bg-indigo-500/30 overflow-x-hidden bg-[#050505] text-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto overflow-visible">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[800px] bg-indigo-600/10 blur-[180px] rounded-full -z-10 pointer-events-none" />
          
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="reveal opacity-0 translate-y-10 transition-all duration-1000">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.2em] mb-8 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>Next Gen Native Voice AI is here</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-outfit font-bold leading-[0.9] mb-10 tracking-tighter">
                Scale with <br />
                <span className="bg-gradient-to-r from-indigo-400 via-white to-purple-400 bg-clip-text text-transparent italic">Voice.</span>
              </h1>
              <p className="text-xl text-white/40 mb-12 max-w-lg leading-relaxed font-light">
                Capture 100% of missed calls and automate appointment scheduling with zero-latency human-like receptionists.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={scrollToForm}
                  className="w-full sm:w-auto px-10 py-6 bg-white text-black font-black rounded-[2rem] hover:bg-white/90 transition-all active:scale-[0.98] shadow-2xl shadow-white/10 text-lg"
                >
                  Book a Demo
                </button>
                <div className="flex flex-col items-start">
                    <div className="flex -space-x-3 mb-2">
                        {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-[#050505] bg-white/10" />)}
                    </div>
                    <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Trusted by 40+ local businesses</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end relative reveal opacity-0 translate-y-10 transition-all duration-1000 delay-300">
              <VoiceAgent />
            </div>
          </div>
        </section>

        {/* Clients Revolving Marquee Section - MOVED UP */}
        <section id="clients" className="py-24 px-6 border-y border-white/5 bg-white/[0.01] overflow-hidden">
          <div className="max-w-7xl mx-auto mb-16 text-center reveal opacity-0 translate-y-10 transition-all duration-700">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400/60 mb-2">Trusted By</h3>
            <h2 className="text-4xl font-outfit font-bold text-white">Powering Growth For</h2>
          </div>
          
          <div className="relative flex overflow-hidden group">
            <div className="flex animate-marquee whitespace-nowrap py-10">
              {[...CLIENTS, ...CLIENTS].map((client, i) => (
                <div key={i} className="mx-16 flex items-center group/client transition-all duration-500">
                  <div className="flex items-center space-x-2 px-10 py-5 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-indigo-500/20 transition-all hover:-translate-y-1 hover:bg-white/[0.05]">
                    <span className="text-2xl font-outfit font-bold tracking-tight text-white/60 group-hover/client:text-white transition-colors">{client}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#050505] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#050505] to-transparent z-10" />
          </div>
        </section>

        {/* Feature Bento Grid (Solutions) */}
        <section id="solutions" className="py-32 px-6 max-w-7xl mx-auto">
           <div className="reveal opacity-0 translate-y-10 transition-all duration-700 text-center mb-20">
              <h2 className="text-5xl font-outfit font-bold mb-4 tracking-tight">Enterprise-Grade Voice</h2>
              <p className="text-white/40 font-light max-w-xl mx-auto">Comprehensive scenarios to automate your front office and sales department.</p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* No Lead Loss */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 group reveal opacity-0 translate-y-10 transition-all duration-700">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">No Lead Loss</h3>
                <p className="text-white/30 text-sm leading-relaxed">24/7 inbound receptionist handles every call. No more missed voicemails or lost revenue from after-hours queries.</p>
              </div>

              {/* Instant Booking */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 group reveal opacity-0 translate-y-10 transition-all duration-700 delay-100">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:bg-purple-500/20 transition-all">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Booking</h3>
                <p className="text-white/30 text-sm leading-relaxed">Direct integration with Google Calendar and GHL. AI books appointments mid-call without any human intervention.</p>
              </div>

              {/* Reminder Setup */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 group reveal opacity-0 translate-y-10 transition-all duration-700 delay-200">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Reminder Setup</h3>
                <p className="text-white/30 text-sm leading-relaxed">Automated SMS and call reminders to ensure zero no-shows for scheduled appointments and services.</p>
              </div>

              {/* Outbound Calls */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 group reveal opacity-0 translate-y-10 transition-all duration-700 delay-300">
                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-6 border border-rose-500/20 group-hover:bg-rose-500/20 transition-all">
                  <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Outbound Calls</h3>
                <p className="text-white/30 text-sm leading-relaxed">Reactivate cold leads and follow up on abandoned inquiries with personalized outbound voice campaigns.</p>
              </div>
           </div>
        </section>

        {/* Results Section */}
        <section id="results" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 reveal opacity-0 translate-y-10 transition-all duration-700">
            <h2 className="text-5xl font-outfit font-bold text-white mb-6 tracking-tight">Validated Growth</h2>
            <p className="text-white/40 font-light leading-relaxed">Local businesses are seeing massive results by capturing every inbound opportunity.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="group p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] transition-all hover:from-indigo-500/20 reveal opacity-0 translate-y-10 transition-all duration-700">
              <div className="h-full p-12 bg-[#0a0a0a] rounded-[2.8rem] border border-white/5">
                <div className="text-indigo-400 font-mono text-xs tracking-widest uppercase mb-6">Auto Dealership</div>
                <h3 className="text-3xl font-bold text-white mb-8 leading-snug">"24/7 lead capture boosted test-drive volume by 45%."</h3>
                <div className="flex gap-8">
                  <div>
                    <div className="text-2xl font-bold text-white">45%</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Growth</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold text-white">350+</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Leads/mo</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="group p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] transition-all hover:from-purple-500/20 reveal opacity-0 translate-y-10 transition-all duration-700 delay-200">
              <div className="h-full p-12 bg-[#0a0a0a] rounded-[2.8rem] border border-white/5">
                <div className="text-purple-400 font-mono text-xs tracking-widest uppercase mb-6">Medical Spa</div>
                <h3 className="text-3xl font-bold text-white mb-8 leading-snug">"Instant scheduling reduced front-desk churn by 60%."</h3>
                <div className="flex gap-8">
                  <div>
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Coverage</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold text-white">2.5x</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Efficiency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section (Optimized for SaaS) */}
        <section className="py-40 px-6 max-w-5xl mx-auto">
           <div className="reveal opacity-0 translate-y-10 transition-all duration-700 text-center mb-20">
              <h2 className="text-5xl font-outfit font-bold mb-6">Zero Leads Lost. Guaranteed.</h2>
              <p className="text-white/30">Don't let business-as-usual cost you thousands in missed revenue.</p>
           </div>
           
           <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden reveal opacity-0 translate-y-10 transition-all duration-700 shadow-2xl">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-white/5">
                       <th className="p-8 text-sm font-bold uppercase tracking-widest text-white/30">Capability</th>
                       <th className="p-8 text-sm font-bold uppercase tracking-widest text-white/30">Business Without AI</th>
                       <th className="p-8 text-sm font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400">Powered by Tigest</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm">
                    {[
                      { f: 'After-Hours Support', h: 'Voicemail (Leads Lost)', a: '24/7 Voice Capture' },
                      { f: 'Response Latency', h: 'Next-Day Callback', a: '< 1 Second' },
                      { f: 'Call Capacity', h: 'One at a time', a: 'Unlimited' },
                      { f: 'Lead Integration', h: 'Manual Entry', a: 'Native CRM Sync' },
                      { f: 'Cost Efficiency', h: 'Lost Revenue', a: 'Starts $99/mo' }
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                         <td className="p-8 font-medium text-white/60">{row.f}</td>
                         <td className="p-8 text-white/40">{row.h}</td>
                         <td className="p-8 font-bold text-white bg-indigo-500/[0.03]">{row.a}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>

        {/* ROI Calculator Integrated Here */}
        <ROICalculator />

        {/* Integration Section */}
        <section id="integrations" className="py-32 px-6 border-y border-white/5 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent overflow-hidden">
          <div className="max-w-7xl mx-auto mb-16 text-center reveal opacity-0 translate-y-10 transition-all duration-700">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400/60 mb-2">Native Ecosystem</h3>
            <h2 className="text-2xl font-outfit font-bold text-white">Seamless Integrations</h2>
          </div>
          
          <div className="relative flex overflow-hidden group">
            <div className="flex animate-marquee whitespace-nowrap py-10">
              {[...LOGOS, ...LOGOS].map((brand, i) => (
                <div key={i} className="mx-12 flex items-center group/logo transition-all duration-500">
                  <div 
                    className="flex items-center space-x-2 px-8 py-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1"
                    style={{ color: brand.color }}
                  >
                    <div className="transition-transform group-hover/logo:scale-110 duration-500">
                      {brand.icon}
                    </div>
                    <span className="text-xl font-outfit font-bold tracking-tight text-white/80 group-hover/logo:text-white transition-colors">{brand.name}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#050505] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#050505] to-transparent z-10" />
          </div>
        </section>

        {/* Final CTA (Includes Pricing Mentions) */}
        <section id="contact-form" className="py-40 px-6">
          <div className="max-w-4xl mx-auto relative reveal opacity-0 translate-y-10 transition-all duration-700">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full -z-10" />
            
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[4rem] p-8 md:p-24 shadow-2xl overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
               
               {formStatus === 'success' ? (
                 <div className="text-center py-12 animate-in fade-in zoom-in duration-700">
                   <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-10">
                     <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <h2 className="text-4xl font-outfit font-bold text-white mb-4">Request Received.</h2>
                   <p className="text-white/40 max-w-sm mx-auto leading-relaxed">Our implementation specialist will reach out within 24 hours to finalize your demo and pricing plan.</p>
                   <button onClick={() => setFormStatus('idle')} className="mt-12 text-indigo-400 text-sm font-bold hover:underline">Submit another request</button>
                 </div>
               ) : (
                 <>
                   <div className="text-center mb-16">
                     <h2 className="text-6xl font-outfit font-bold text-white mb-6 tracking-tighter">Ready to Scale?</h2>
                     <p className="text-white/40 font-light max-w-md mx-auto">Plans starting at <span className="text-white font-bold">$99/mo</span>. Fill in the details below and we'll build your business-specific demo.</p>
                   </div>
                   
                   <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                       <label className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] ml-1">Company Name</label>
                       <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.04] transition-all" placeholder="Grand Motors Ltd." />
                     </div>
                     <div className="space-y-3">
                       <label className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] ml-1">Contact Email</label>
                       <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.04] transition-all" placeholder="founder@business.com" />
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <label className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] ml-1">Business Website</label>
                       <input required type="text" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.04] transition-all" placeholder="https://yourwebsite.com" />
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <label className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] ml-1">What's your primary goal?</label>
                       <textarea rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.04] transition-all resize-none" placeholder="e.g. I want to automate booking for my hair salon..." />
                     </div>
                     <button type="submit" disabled={formStatus === 'loading'} className="md:col-span-2 py-6 bg-white text-black font-black text-xl rounded-2xl transition-all shadow-2xl shadow-white/5 active:scale-[0.98] flex items-center justify-center group overflow-hidden relative mt-8">
                       {formStatus === 'loading' ? (
                         <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                       ) : (
                         <span className="relative z-10 flex items-center">
                           Get Your Custom Demo
                           <svg className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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

      <footer className="py-32 border-t border-white/5 bg-[#030303] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/[0.02] blur-[150px] rounded-full" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-20">
            <div className="max-w-sm">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 flex items-center justify-center">
                  <TigestLogo />
                </div>
                <span className="text-3xl font-outfit font-bold text-white tracking-tighter">Tigest</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed mb-10 font-light">
                Helping businesses build and launch their native AI receptionists. Redefining performance for 2025.
              </p>
              <p className="text-white/10 text-[10px] font-mono tracking-widest uppercase">© 2025 Tigest AI // All Rights Reserved</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-16">
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Social Connect</h4>
                    <ul className="flex items-center space-x-8 text-sm text-white/40">
                        <li><a href="https://www.linkedin.com/company/tigestclub/" className="hover:text-white transition-colors">LinkedIn</a></li>
                        <li><a href="https://www.youtube.com/@KunaalAI" className="hover:text-white transition-colors">YouTube</a></li>
                        <li><a href="https://www.skool.com/voice-ai-agent-builders-7694/about" className="hover:text-white transition-colors">Skool</a></li>
                    </ul>
                </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
