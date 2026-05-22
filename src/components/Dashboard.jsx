import React from 'react';
import {
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  FileText
} from 'lucide-react';
import { formatMonthDisplay, getNextMonthStr } from '../utils/helpers';

export default function Dashboard({
  isLoading,
  selectedMonth,
  maxMonth,
  handlePrevMonth,
  handleNextMonth,
  totalCarpentersCount,
  bonusEligibleCount,
  totalPurchasesAmount,
  searchQuery,
  setSearchQuery,
  filteredCarpenters,
  onAddClick,
  onEditClick,
  onViewClick,
  onDeleteClick,
  deletingId,
  setDeletingId,
  onToggleVisit,
  onPurchaseBlur
}) {
  return (
    <div className="fade-in space-y-6 sm:space-y-8">
      {/* Header Title Section & Synced Month Navigator */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white rounded-2xl border border-[#F5E6D3] p-4 sm:p-6 shadow-sm">
        <div className="text-center lg:text-left">
          <h2 className="font-logo font-black text-xl sm:text-2xl text-[#7B3A10] m-0 leading-tight">
            Carpenter Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            Manage carpenter visits, purchase histories, and bonus qualifications.
          </p>
        </div>

        {/* MONTH NAVIGATOR WIDGET */}
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

      {/* THREE METRICS HIGHLIGHT ROW */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6">
        {/* Metric 1: Total Carpenters */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#F5E6D3] p-2.5 sm:p-6 flex flex-col sm:flex-row sm:items-center items-center text-center sm:text-left sm:space-x-4 shadow-sm hover:shadow-md transition-shadow select-none">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#FAF6F0] text-[#7B3A10] rounded-lg sm:rounded-xl flex items-center justify-center shadow-inner shrink-0 mb-1.5 sm:mb-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
              Total
            </span>
            <span className="font-logo text-sm sm:text-2xl font-black text-[#7B3A10] leading-none mt-0.5 sm:mt-1 truncate">
              {totalCarpentersCount}
            </span>
          </div>
        </div>

        {/* Metric 2: Bonus Eligible */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#F5E6D3] p-2.5 sm:p-6 flex flex-col sm:flex-row sm:items-center items-center text-center sm:text-left sm:space-x-4 shadow-sm hover:shadow-md transition-shadow select-none">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#FFFBEB] text-[#D97706] rounded-lg sm:rounded-xl flex items-center justify-center shadow-inner shrink-0 mb-1.5 sm:mb-0">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </div>
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
              Eligible
            </span>
            <span className="font-logo text-sm sm:text-2xl font-black text-[#D97706] leading-none mt-0.5 sm:mt-1 truncate">
              {bonusEligibleCount}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Purchases */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#F5E6D3] p-2.5 sm:p-6 flex flex-col sm:flex-row sm:items-center items-center text-center sm:text-left sm:space-x-4 shadow-sm hover:shadow-md transition-shadow select-none">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#FAF6F0] text-[#7B3A10] rounded-lg sm:rounded-xl flex items-center justify-center shadow-inner font-bold text-sm sm:text-lg shrink-0 mb-1.5 sm:mb-0">
            ₹
          </div>
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
              Purchases
            </span>
            <span className="font-logo text-xs sm:text-2xl font-black text-[#7B3A10] leading-none mt-0.5 sm:mt-1 truncate">
              ₹{totalPurchasesAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH & PRIMARY BUTTON */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Responsive Search Box */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search carpenter by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E6D4C0] rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/10 text-[#4A3E3D] transition-all placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Add Carpenter Action */}
        <button
          onClick={onAddClick}
          className="w-full sm:w-auto px-5 py-3.5 bg-[#D97706] hover:bg-[#C26B05] text-white rounded-xl shadow-md flex items-center justify-center space-x-2 font-bold text-xs tracking-wider uppercase transition-all select-none hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Carpenter</span>
        </button>
      </div>

      {/* SEPARATED SECTION: CARPENTERS LIST GRID */}
      <div>
        <div className="flex items-center space-x-2 mb-4 px-1">
          <span className="text-xs font-bold tracking-wider text-[#8E7E7A] uppercase select-none">
            CARPENTERS
          </span>
          <span className="bg-[#7B3A10]/15 text-[#7B3A10] px-2 py-0.5 rounded-full text-[10px] font-bold">
            {filteredCarpenters.length}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#8E7E7A] space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#D97706]" />
            <span className="text-sm font-medium">Loading Records...</span>
          </div>
        ) : filteredCarpenters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-[#F5E6D3] p-8 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#D97706] mb-4 shadow-inner">
              <LayoutGrid className="w-6 h-6 opacity-60" />
            </div>
            {totalCarpentersCount === 0 ? (
              <>
                <h4 className="text-[#7B3A10] font-bold text-lg">No carpenters added yet</h4>
                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                  Tap the "Add Carpenter" button above to initialize your tracking list.
                </p>
              </>
            ) : (
              <>
                <h4 className="text-[#7B3A10] font-bold text-lg">No matches found</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Try refining your search terms or keywords.
                </p>
              </>
            )}
          </div>
        ) : (
          /* RESPONSIVE CARD GRID SYSTEM */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCarpenters.map((carpenter, idx) => {
              const cData = monthData[carpenter._id || carpenter.id] || {
                visits: Array.from({ length: 5 }, (_, i) => ({ visitNumber: i + 1, completed: false, date: null, purchase: 0 })),
                totalPurchase: 0,
                bonusEligible: false
              };
              const completedVisitsCount = cData.visits.filter(v => v.completed).length;

              return (
                <div
                  key={carpenter._id || carpenter.id}
                  className="bg-white rounded-2xl border border-[#F5E6D3] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative flex flex-col justify-between"
                >
                  {/* Top Header inside Carpenter Card */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3 max-w-[70%]">
                        <div className="w-7 h-7 bg-[#FAF6F0] text-[#7B3A10] font-bold text-xs rounded-lg flex items-center justify-center shrink-0 border border-[#F5E6D3]">
                          {idx + 1}
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-[#4A3E3D] text-sm sm:text-base leading-tight truncate">
                            {carpenter.name}
                          </h4>
                          <p className="text-xs text-gray-400 tracking-wide mt-0.5">
                            {carpenter.phone}
                          </p>
                        </div>
                      </div>

                      {/* Actions Group */}
                      {deletingId === (carpenter._id || carpenter.id) ? (
                        <div className="flex items-center space-x-2 text-[10px] sm:text-xs bg-red-50 border border-red-200 px-2 py-1 rounded-xl shadow-sm">
                          <span className="text-red-700 font-bold">Sure?</span>
                          <button
                            onClick={() => onDeleteClick(carpenter._id || carpenter.id)}
                            className="text-red-600 font-extrabold hover:underline cursor-pointer"
                          >
                            Yes
                          </button>
                          <span className="text-gray-300">/</span>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-gray-500 font-medium hover:underline cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-0.5 shrink-0">
                          <button
                            onClick={() => onViewClick(carpenter)}
                            title="View Details"
                            className="p-2 hover:bg-[#FAF6F0] rounded-full text-[#D97706] transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditClick(carpenter)}
                            title="Edit Profile"
                            className="p-2 hover:bg-[#FAF6F0] rounded-full text-gray-500 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(carpenter._id || carpenter.id)}
                            title="Delete Carpenter"
                            className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* VISITS PROGRESSION TRACK */}
                    <div className="border-t border-[#FAF6F0] pt-4">
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 block mb-2.5 px-0.5">
                        VISITS TRACKER
                      </span>

                      {/* 5 Checkable Circles Row */}
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {cData.visits.map((visit, vIdx) => (
                          <div key={vIdx} className="flex flex-col items-center">
                            <span className="text-[10px] text-gray-400 font-medium mb-1 select-none">
                              V{vIdx + 1}
                            </span>
                            <button
                              onClick={() => onToggleVisit(carpenter._id || carpenter.id, vIdx)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                                visit.completed
                                  ? 'bg-[#D97706] border-[#D97706] text-white shadow-sm ring-4 ring-[#D97706]/5 scale-105'
                                  : 'bg-[#FAF6F0]/40 hover:bg-[#FAF6F0] border-[#E6D4C0] text-transparent hover:border-[#D97706]/40'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                            {visit.completed && visit.date && (
                              <span className="text-[9px] text-[#D97706] font-bold mt-1.5 tracking-tighter truncate text-center max-w-full">
                                {visit.date}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Purchase Inputs (Desktop only) */}
                      {completedVisitsCount > 0 && (
                        <div className="hidden sm:grid grid-cols-5 gap-2 mb-4 bg-[#FAF6F0]/50 border border-[#F5E6D3] rounded-xl p-2">
                          {cData.visits.map((visit, vIdx) => (
                            <div key={vIdx} className="flex flex-col justify-end">
                              {visit.completed ? (
                                <div className="relative">
                                  <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-[9px] font-bold text-[#8E7E7A]">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    defaultValue={visit.purchase || ''}
                                    placeholder="0"
                                    onBlur={(e) => onPurchaseBlur(carpenter._id || carpenter.id, vIdx, e.target.value)}
                                    className="w-full bg-white border border-[#E6D4C0] rounded-lg pl-3 pr-1 py-1 text-[11px] font-bold focus:outline-none focus:border-[#D97706] text-right focus:ring-1 focus:ring-[#D97706]"
                                  />
                                </div>
                              ) : (
                                <div className="h-6 w-full bg-gray-100/30 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                                  <span className="text-[9px] text-gray-300">—</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats inside Card */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#FAF6F0]">
                    <span className="font-logo font-black text-sm sm:text-base text-[#7B3A10] select-none">
                      Total: ₹{cData.totalPurchase.toLocaleString('en-IN')}
                    </span>

                    {/* Progress Badge */}
                    <div
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold select-none ${
                        cData.bonusEligible
                          ? 'bg-[#D1FAE5] text-[#065F46] ring-1 ring-[#065F46]/20'
                          : completedVisitsCount === 5
                          ? 'bg-[#DBEAFE] text-[#1E40AF] ring-1 ring-[#1E40AF]/20'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cData.bonusEligible ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>Eligible</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className={`w-3 h-3 ${completedVisitsCount > 0 && completedVisitsCount < 5 ? 'animate-spin' : ''}`} />
                          <span>{completedVisitsCount}/5</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
