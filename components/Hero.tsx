
import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />
      
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Now Launching: Gemini 2.5 Voice Integration</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-outfit font-bold text-white leading-tight mb-6">
            Automate your <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">customer voice</span>
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-lg">
            Built for car dealerships, restaurants, and salons. Our AI voice agents capture leads and book appointments while you sleep.
          </p>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex -space-x-3 overflow-hidden">
              {[1,2,3,4].map(i => (
                <img 
                  key={i}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-[#050505]" 
                  src={`https://picsum.photos/100/100?random=${i}`} 
                  alt="User" 
                />
              ))}
            </div>
            <div className="text-sm">
              <span className="text-white font-semibold">500+ Businesses</span>
              <p className="text-white/40">Trust NovaVoice to handle their calls.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          {/* Voice Agent is injected here in App.tsx */}
          <div id="voice-agent-container" className="w-full max-w-md">
            {/* Component is rendered via parent */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
