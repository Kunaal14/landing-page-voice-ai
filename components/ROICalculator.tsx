
import React, { useState, useMemo, useCallback, memo } from 'react';

const ROICalculator: React.FC = () => {
  // --- Financial Parameters ---
  const [ticketValue, setTicketValue] = useState(500);
  const [profitMargin, setProfitMargin] = useState(40);
  const [closeRate, setCloseRate] = useState(20);

  // --- Inbound Logistics ---
  const [monthlyInbound, setMonthlyInbound] = useState(350);
  const [missedCallRate, setMissedCallRate] = useState(25);
  const [staleLeads, setStaleLeads] = useState(200);
  const [reactivationEffort, setReactivationEffort] = useState(15);

  // --- Operations & Human Capital ---
  const [receptionistSalary, setReceptionistSalary] = useState(3200);
  const [timeSpentOnCalls, setTimeSpentOnCalls] = useState(60);

  // --- Calculations ---
  const analytics = useMemo(() => {
    // Profit per sale
    const unitProfit = ticketValue * (profitMargin / 100);

    // 1. Inbound Missed Call Recovery
    const monthlyMissed = monthlyInbound * (missedCallRate / 100);
    // AI captures them (95% efficiency vs human voicemail/lost)
    const recoveredLeads = monthlyMissed * 0.95;
    // They book and close
    const recoveredSales = recoveredLeads * (closeRate / 100);
    const inboundValue = recoveredSales * unitProfit;

    // 2. Outbound / CRM Reactivation
    const reactivatedSales = staleLeads * (reactivationEffort / 100) * (closeRate / 100);
    const outboundValue = reactivatedSales * unitProfit;

    // 3. Labor Cost Reduction
    const laborRecovery = receptionistSalary * (timeSpentOnCalls / 100);
    
    // Total Impact
    const grossImpact = inboundValue + outboundValue + laborRecovery;
    const tigestFee = 99; // Base subscription
    const netMonthly = grossImpact - tigestFee;
    const annualImpact = netMonthly * 12;

    return {
      inboundValue,
      outboundValue,
      laborRecovery,
      netMonthly,
      annualImpact,
      recoveredSales: Math.round(recoveredSales + reactivatedSales),
      efficiencyGain: Math.round((timeSpentOnCalls / 100) * 160)
    };
  }, [ticketValue, profitMargin, closeRate, monthlyInbound, missedCallRate, staleLeads, reactivationEffort, receptionistSalary, timeSpentOnCalls]);

  // Helper function to render working slider with gradient track
  const renderSlider = (label: string, value: number, min: number, max: number, step: number, onChange: (value: number) => void, prefix = "", suffix = "") => {
    const percentage = ((value - min) / (max - min)) * 100;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            {label}
          </label>
          <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
            {prefix}{value.toLocaleString()}{suffix}
          </span>
        </div>
        <div style={{ position: 'relative', height: '24px' }}>
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              transform: 'translateY(-50%)',
              width: '100%',
              height: '4px',
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ width: '100%', position: 'relative', zIndex: 1, background: 'transparent' }}
          />
        </div>
      </div>
    );
  };

  return (
    <section id="roi-calculator" className="py-24 px-6 max-w-7xl mx-auto">
      {/* Comprehensive Section Heading */}
      <div className="mb-20 text-center lg:text-left reveal opacity-0 translate-y-10 transition-all duration-1000">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-[0.4em] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>Growth Forecaster v2.1</span>
        </div>
        <h2 className="text-6xl md:text-7xl font-outfit font-bold text-white mb-8 tracking-tighter leading-none">
          Project Your <span className="text-indigo-500 italic">Net Lift.</span>
        </h2>
        <p className="text-white/40 text-lg font-light max-w-2xl leading-relaxed">
          Fine-tune the variables of your current operation. Our economic engine identifies the exact revenue leakage Tigest AI will capture.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left: Interactive Input Panel */}
        <div className="flex-1 w-full space-y-8">
          
          {/* Card 1: Sales Dynamics */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative group" style={{ overflow: 'visible' }}>
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 pointer-events-none">
                <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             
            <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-14 flex items-center">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-4 shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
              Sales Dynamics
            </h4>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-12" style={{ position: 'relative', zIndex: 1 }}>
              {/* Working inline sliders with track styling */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                    Avg. Sale Ticket
                  </label>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                    ${ticketValue.toLocaleString()}
                  </span>
                </div>
                <div style={{ position: 'relative', height: '24px' }}>
                  <div 
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      transform: 'translateY(-50%)',
                      width: '100%',
                      height: '4px',
                      background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((ticketValue - 100) / (10000 - 100)) * 100}%, rgba(255,255,255,0.1) ${((ticketValue - 100) / (10000 - 100)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      borderRadius: '2px',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }}
                  />
                  <input 
                    type="range" 
                    min={100} 
                    max={10000} 
                    step={1} 
                    value={ticketValue} 
                    onChange={(e) => setTicketValue(Number(e.target.value))}
                    style={{ width: '100%', position: 'relative', zIndex: 1, background: 'transparent' }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                    Closing Rate
                  </label>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                    {closeRate}%
                  </span>
                </div>
                <div style={{ position: 'relative', height: '24px' }}>
                  <div 
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      transform: 'translateY(-50%)',
                      width: '100%',
                      height: '4px',
                      background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((closeRate - 1) / (95 - 1)) * 100}%, rgba(255,255,255,0.1) ${((closeRate - 1) / (95 - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      borderRadius: '2px',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }}
                  />
                  <input 
                    type="range" 
                    min={1} 
                    max={95} 
                    step={1} 
                    value={closeRate} 
                    onChange={(e) => setCloseRate(Number(e.target.value))}
                    style={{ width: '100%', position: 'relative', zIndex: 1, background: 'transparent' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Funnel Metrics */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative group" style={{ overflow: 'visible' }}>
            <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-400 mb-14 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-4 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
              Funnel Metrics
            </h4>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-12" style={{ position: 'relative', zIndex: 1 }}>
              {renderSlider("Monthly Inbound", monthlyInbound, 10, 10000, 1, setMonthlyInbound)}
              {renderSlider("Calls Missed", missedCallRate, 1, 95, 1, setMissedCallRate, "", "%")}
              {renderSlider("Stale Leads (CRM)", staleLeads, 0, 10000, 1, setStaleLeads, "", " Leads")}
              {renderSlider("Reactivation Intensity", reactivationEffort, 0, 100, 1, setReactivationEffort, "", "%")}
            </div>
          </div>

          {/* Card 3: Overhead Reduction */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative group" style={{ overflow: 'visible' }}>
            <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-orange-400 mb-14 flex items-center">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-4 shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
              Overhead Reduction
            </h4>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-12" style={{ position: 'relative', zIndex: 1 }}>
              {renderSlider("Monthly Labor Cost", receptionistSalary, 500, 20000, 1, setReceptionistSalary, "$")}
              {renderSlider("Phone Time (Human)", timeSpentOnCalls, 1, 100, 1, setTimeSpentOnCalls, "", "%")}
            </div>
          </div>

        </div>

        {/* Right: Results Dashboard */}
        <div className="w-full lg:w-[480px] shrink-0 sticky top-32">
          <div className="relative p-12 bg-[#080808] border border-white/10 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="space-y-14 relative z-10">
              <div className="pb-12 border-b border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-5">Net Monthly Growth</h3>
                <div className="text-8xl font-outfit font-bold text-white tracking-tighter flex items-baseline">
                  <span className="text-3xl text-indigo-500 mr-3">$</span>
                  {Math.round(analytics.netMonthly).toLocaleString()}
                </div>
                <div className="mt-8 flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/90 bg-emerald-400/5 py-3 px-5 rounded-2xl border border-emerald-400/20 inline-flex">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  <span>Identified Revenue Potential</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] group hover:border-indigo-500/30 transition-all duration-700">
                  <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Unit Closures</div>
                  <div className="text-4xl font-bold text-white tracking-tight">+{analytics.recoveredSales}</div>
                  <div className="text-[9px] text-white/10 mt-4 font-bold uppercase tracking-tighter">New / mo</div>
                </div>
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] group hover:border-orange-500/30 transition-all duration-700">
                  <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-3">Capacity lift</div>
                  <div className="text-4xl font-bold text-white tracking-tight">{analytics.efficiencyGain}h</div>
                  <div className="text-[9px] text-white/10 mt-4 font-bold uppercase tracking-tighter">Reclaimed</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40 italic font-light tracking-wide">Funnel Leak Capture</span>
                  <span className="text-white font-mono font-bold text-base tracking-tight">+${Math.round(analytics.inboundValue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40 italic font-light tracking-wide">Cold CRM Reactivation</span>
                  <span className="text-white font-mono font-bold text-base tracking-tight">+${Math.round(analytics.outboundValue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40 italic font-light tracking-wide">Human Overhead Savings</span>
                  <span className="text-white font-mono font-bold text-base tracking-tight">+${Math.round(analytics.laborRecovery).toLocaleString()}</span>
                </div>
                
                <div className="pt-12 mt-6 border-t border-white/5">
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white/50">Annual Impact</span>
                    <span className="text-5xl font-outfit font-bold text-emerald-400 tracking-tighter drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                      +${Math.round(analytics.annualImpact).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/10 leading-relaxed font-medium text-center italic pt-6">
                    *Based on Gemini 2.5 Flash native inference and 99.9% uptime protocols.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({behavior:'smooth'})}
                className="w-full py-8 bg-white text-black font-black text-2xl rounded-[2.5rem] hover:bg-indigo-50 transition-all shadow-[0_25px_60px_-15px_rgba(255,255,255,0.3)] active:scale-[0.98] group"
              >
                Hire Sara AI
                <svg className="w-6 h-6 inline-block ml-4 group-hover:translate-x-3 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              
              <div className="text-center">
                <span className="text-[9px] text-white/5 uppercase tracking-[0.8em] font-black block pt-4">
                  POWERED BY TIGEST STRATEGIC CORE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;
