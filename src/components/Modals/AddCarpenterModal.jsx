import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function AddCarpenterModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), phone: phone.trim() });
    setName('');
    setPhone('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white w-full rounded-2xl p-6 space-y-4 max-w-md shadow-2xl border border-[#F5E6D3]">
        <div className="flex justify-between items-center border-b border-[#FAF6F0] pb-3">
          <h3 className="font-logo font-bold text-lg text-[#7B3A10]">
            Add New Carpenter Profile
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
              Carpenter Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ca Palani Srinivasapuram"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#FAF6F0]/60 border border-[#E6D4C0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/10 text-[#4A3E3D] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
              Active Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. +917305757038"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#FAF6F0]/60 border border-[#E6D4C0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/10 text-[#4A3E3D] transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#D97706] hover:bg-[#C26B05] text-white font-bold rounded-xl shadow-md transition-colors select-none font-logo text-sm tracking-wider uppercase cursor-pointer"
            >
              Create Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
