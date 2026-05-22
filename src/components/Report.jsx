import React from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  RefreshCw,
  Star
} from 'lucide-react';
import { formatMonthDisplay, getNextMonthStr } from '../utils/helpers';

export default function Report({
  selectedMonth,
  maxMonth,
  handlePrevMonth,
  handleNextMonth,
  filteredCarpenters,
  monthData,
  prevMonthData,
  handleExportCSV,
  handleExportPDF
}) {
  return (
    <div className="fade-in space-y-6 sm:space-y-8">
      {/* Header controls & synced month navigator */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white rounded-2xl border border-[#F5E6D3] p-4 sm:p-6 shadow-sm">
        <div className="text-center lg:text-left">
          <h2 className="font-logo font-black text-xl sm:text-2xl text-[#7B3A10] m-0 leading-tight">
            Qualification Report
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            Analyze carpenter metrics, download datasets, or trigger printing.
          </p>
        </div>

        {/* Synced Month Navigator */}
        <div className="flex items-center bg-[#FAF6F0] rounded-xl border border-[#E6D4C0] px-2 py-1.5 shadow-inner scale-95 sm:scale-100">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-colors text-[#7B3A10] active:scale-90 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          <span className="font-logo text-[#7B3A10] font-black text-sm sm:text-base px-6 tracking-wide select-none">
            {formatMonthDisplay(selectedMonth)}
          </span>
          
          <button
            onClick={handleNextMonth}
            disabled={getNextMonthStr(selectedMonth) > maxMonth}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-90 cursor-pointer ${
              getNextMonthStr(selectedMonth) > maxMonth
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-white text-[#7B3A10]'
            }`}
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* EXPORT ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 py-3 px-5 bg-white border border-[#E6D4C0] hover:bg-[#FAF6F0] rounded-xl text-xs sm:text-sm font-bold text-[#7B3A10] shadow-sm active:scale-95 transition-all select-none cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={handleExportPDF}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 py-3 px-5 bg-white border border-[#E6D4C0] hover:bg-[#FAF6F0] rounded-xl text-xs sm:text-sm font-bold text-[#7B3A10] shadow-sm active:scale-95 transition-all select-none cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Export PDF / Print</span>
        </button>
      </div>

      {/* Desktop View Table: Hidden on Mobile */}
      <div className="hidden sm:block bg-white rounded-2xl border border-[#F5E6D3] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#7B3A10] text-[#FDF6EE] text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-16">#</th>
                <th className="py-4 px-6">Name / Phone</th>
                <th className="py-4 px-6 text-center">Visits</th>
                <th className="py-4 px-6 text-right">Purchase Amount</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Prior Month Comparison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5E6D3]">
              {filteredCarpenters.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-medium text-sm">
                    No carpenter records to display.
                  </td>
                </tr>
              ) : (
                filteredCarpenters.map((carp, idx) => {
                  const mData = monthData[carp._id || carp.id] || {
                    visits: [],
                    totalPurchase: 0,
                    bonusEligible: false
                  };
                  const completedCount = mData.visits.filter(v => v.completed).length;
                  
                  const pData = prevMonthData[carp._id || carp.id];
                  const prevCompleted = pData ? pData.visits.filter(v => v.completed).length : null;
                  const prevTotal = pData ? pData.totalPurchase : null;

                  return (
                    <tr key={carp._id || carp.id} className="hover:bg-[#FAF6F0]/40 transition-colors text-sm">
                      <td className="py-4 px-6 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#4A3E3D]">{carp.name}</div>
                        <div className="text-xs text-gray-400 font-medium mt-0.5">{carp.phone}</div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-[#7B3A10]">
                        {completedCount} / 5
                      </td>
                      <td className="py-4 px-6 text-right font-black text-[#4A3E3D]">
                        ₹{mData.totalPurchase.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {mData.bonusEligible ? (
                          <span className="inline-flex items-center space-x-1 bg-[#D1FAE5] text-[#065F46] px-3 py-1 rounded-full font-bold text-xs ring-1 ring-[#065F46]/20">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>Eligible</span>
                          </span>
                        ) : completedCount === 5 ? (
                          <span className="inline-flex items-center space-x-1 bg-[#DBEAFE] text-[#1E40AF] px-3 py-1 rounded-full font-bold text-xs ring-1 ring-[#1E40AF]/20">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold text-xs">
                            <RefreshCw className="w-3 h-3 animate-spin text-[#D97706]" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {pData ? (
                          <span className="inline-block text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-xl">
                            {prevCompleted}/5 visits — ₹{prevTotal.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View Cards: Hidden on Desktop */}
      <div className="sm:hidden space-y-4 mt-6">
        {filteredCarpenters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#F5E6D3] p-8 text-center text-gray-400 text-sm font-medium shadow-sm">
            No carpenter records to display in this report.
          </div>
        ) : (
          filteredCarpenters.map((carp, idx) => {
            const mData = monthData[carp._id || carp.id] || {
              visits: [],
              totalPurchase: 0,
              bonusEligible: false
            };
            const completedCount = mData.visits.filter(v => v.completed).length;
            
            const pData = prevMonthData[carp._id || carp.id];
            const prevCompleted = pData ? pData.visits.filter(v => v.completed).length : null;
            const prevTotal = pData ? pData.totalPurchase : null;

            return (
              <div key={carp._id || carp.id} className="bg-white rounded-2xl border border-[#F5E6D3] p-4 shadow-sm space-y-3 fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[#4A3E3D] text-sm flex items-center gap-2">
                      <span className="bg-[#7B3A10]/10 text-[#7B3A10] px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {carp.name}
                    </div>
                    <div className="text-xs text-gray-400 font-medium mt-0.5">{carp.phone}</div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="select-none">
                    {mData.bonusEligible ? (
                      <span className="bg-[#D1FAE5] text-[#065F46] px-2.5 py-1 rounded-full flex items-center space-x-1 font-bold text-[10px] ring-1 ring-[#065F46]/20">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Eligible</span>
                      </span>
                    ) : completedCount === 5 ? (
                      <span className="bg-[#DBEAFE] text-[#1E40AF] px-2.5 py-1 rounded-full flex items-center space-x-1 font-bold text-[10px] ring-1 ring-[#1E40AF]/20">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full flex items-center space-x-1 font-bold text-[10px]">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>In Progress</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs border-t border-[#FAF6F0] pt-2">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-bold">Visits Done</span>
                    <span className="font-bold text-[#7B3A10]">{completedCount} / 5</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-bold">Total Purchase</span>
                    <span className="font-black text-sm text-[#4A3E3D]">₹{mData.totalPurchase.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                {/* Prior Month comparison */}
                {pData && prevCompleted !== null && (
                  <div className="text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-100 p-2 rounded-xl text-center">
                    Last month: {prevCompleted}/5 visits — ₹{prevTotal.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
