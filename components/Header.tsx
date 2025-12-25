
import React from 'react';

const Header: React.FC = () => {
  const scrollToContact = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-xl font-outfit font-bold text-white tracking-tight">NovaVoice</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Solutions</a>
          <a href="#case-studies" className="hover:text-white transition-colors">Results</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Clients</a>
        </nav>
        
        <div className="flex items-center">
          <button 
            onClick={scrollToContact}
            className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-white/90 transition-all active:scale-[0.98]"
          >
            Launch Your Agent
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
