import React from 'react';
import { X } from 'lucide-react';
import { formatMonthDisplay } from '../../utils/helpers';

export default function ViewCarpenterModal({ isOpen, onClose, carpenter, selectedMonth, recordData }) {
  if (!isOpen || !carpenter) return null;

  const initialRecord = {
    visits: Array.from({ length: 5 }, (_, i) => ({
      visitNumber: i + 1,
      completed: false,
      date: null,
      purchase: 0
    })),
    totalPurchase: 0,
    bonusEligible: false
  };

  const activeRecord = recordData || initialRecord;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white w-full rounded-2xl p-6 max-w-md shadow-2xl border border-[#F5E6D3] space-y-4">
        <div className="flex justify-between items-start border-b border-[#FAF6F0] pb-3.5">
          <div>
            <h3 className="font-logo font-bold text-lg text-[#7B3A10]">
              {carpenter.name}
            </h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">
              {carpenter.phone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Monthly Details Breakdown */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Target Period</span>
            <span className="text-[#7B3A10] font-black text-sm bg-[#7B3A10]/5 px-2.5 py-1 rounded-lg">
              {formatMonthDisplay(selectedMonth)}
            </span>
          </div>

          <div className="border border-[#F5E6D3] rounded-xl p-4 bg-[#FAF6F0]/40 space-y-3">
            <span className="text-[10px] font-bold text-[#8E7E7A] tracking-wider uppercase block border-b border-[#FAF6F0] pb-1.5">
              Visits & Purchases Timeline
            </span>

            <div className="space-y-2.5">
              {activeRecord.visits.map((v, idx) => {
                const amount = v.purchase || 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100/50 last:border-0">
                    <div className="flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        v.completed ? 'bg-[#D97706] text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="font-bold text-gray-600">Visit {idx + 1}</span>
                    </div>
                    
                    <div className="text-right">
                      {v.completed ? (
                        <>
                          <span className="font-black text-[#4A3E3D]">₹{amount.toLocaleString('en-IN')}</span>
                          <span className="text-[9px] text-[#D97706] font-bold block mt-0.5">{v.date}</span>
                        </>
                      ) : (
                        <span className="text-gray-300 font-bold italic">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Purchases</span>
              <span className="text-[#7B3A10] font-black text-lg">
                ₹{activeRecord.totalPurchase.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Status</span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold leading-none ring-1 ${
                activeRecord.bonusEligible
                  ? 'bg-[#D1FAE5] text-[#065F46] ring-[#065F46]/10'
                  : 'bg-red-50 text-red-700 ring-red-700/10'
              }`}>
                {activeRecord.bonusEligible ? 'Bonus Eligible' : 'Not Eligible'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
