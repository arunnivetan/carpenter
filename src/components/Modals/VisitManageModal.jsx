import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function VisitManageModal({ isOpen, onClose, onSubmit, onClear, visitIndex, initialDate, initialAmount }) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || '');
      setAmount(initialAmount != null ? initialAmount.toString() : '');
    }
  }, [isOpen, initialDate, initialAmount]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSubmit({
      completed: true,
      date: date.trim(),
      amount: Number(amount) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white w-full rounded-2xl p-5 max-w-sm shadow-2xl border border-[#F5E6D3] space-y-4">
        <div className="flex justify-between items-center border-b border-[#FAF6F0] pb-2.5">
          <h4 className="font-logo font-bold text-base text-[#7B3A10]">
            Manage Visit {visitIndex + 1}
          </h4>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                Visit Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#FAF6F0]/60 border border-[#E6D4C0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#4A3E3D] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                Purchase Amount (₹)
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#FAF6F0]/60 border border-[#E6D4C0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#4A3E3D] focus:outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2 pt-2">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-[#E6D4C0] hover:bg-gray-50 rounded-xl text-xs font-bold text-[#8E7E7A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#C26B05] text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Clear Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
