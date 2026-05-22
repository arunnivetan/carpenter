import React from 'react';
import { LayoutGrid, FileText } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, setSearchQuery }) {
  const selectTab = (tabName) => {
    setActiveTab(tabName);
    setSearchQuery('');
  };

  return (
    <header className="bg-[#7B3A10] text-white shadow-md sticky top-0 z-30 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#D97706] rounded-xl flex items-center justify-center font-logo font-black text-base sm:text-lg shadow-inner tracking-wider shrink-0 select-none">
            SVP
          </div>
          <div className="flex flex-col">
            <h1 className="font-logo font-bold text-sm sm:text-lg leading-tight tracking-wide m-0 p-0 text-white">
              Sri Vasavi Plywoods
            </h1>
            <span className="text-[#FDF6EE] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase opacity-85 leading-none mt-0.5">
              Carpenter Bonus Tracker
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-3 bg-black/10 p-1 rounded-xl">
          <button
            onClick={() => selectTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg font-bold text-[11px] sm:text-xs tracking-wider uppercase transition-all select-none cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#D97706] text-white shadow-md ring-1 ring-white/10'
                : 'text-[#FDF6EE]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => selectTab('report')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg font-bold text-[11px] sm:text-xs tracking-wider uppercase transition-all select-none cursor-pointer ${
              activeTab === 'report'
                ? 'bg-[#D97706] text-white shadow-md ring-1 ring-white/10'
                : 'text-[#FDF6EE]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>
      </div>
    </header>
  );
}
