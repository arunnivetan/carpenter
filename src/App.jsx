import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutGrid, FileText, Plus } from 'lucide-react';

// Core Page Wrappers
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Dashboard from './components/Dashboard';
import Report from './components/Report';

// Dialog Modals
import AddCarpenterModal from './components/Modals/AddCarpenterModal';
import EditCarpenterModal from './components/Modals/EditCarpenterModal';
import ViewCarpenterModal from './components/Modals/ViewCarpenterModal';
import VisitConfirmModal from './components/Modals/VisitConfirmModal';
import VisitManageModal from './components/Modals/VisitManageModal';

// Services & Helpers
import { api } from './services/api';
import {
  getPrevMonthStr,
  getNextMonthStr,
  getFormattedToday,
  formatMonthDisplay
} from './utils/helpers';

// Load Externalized Styling
import './App.css';

export default function App() {
  // Navigation & Synced Month State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'report'
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const maxMonth = '2026-05'; // Month navigation ceiling

  // Core Data States
  const [carpenters, setCarpenters] = useState([]);
  const [monthData, setMonthData] = useState({}); // { [carpenterId]: record }
  const [prevMonthData, setPrevMonthData] = useState({}); // { [carpenterId]: record }
  const [isLoading, setIsLoading] = useState(true);

  // Unified Notification Toast State
  const [toast, setToast] = useState(null);

  // Modal Dialogue Toggle Controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeCarpenter, setActiveCarpenter] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search Context Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Visit completion confirmations and manager slots
  const [visitConfirmDetails, setVisitConfirmDetails] = useState(null); // { carpenterId, visitIndex, defaultDate, defaultAmount }
  const [visitManageDetails, setVisitManageDetails] = useState(null); // { carpenterId, visitIndex, date, amount }

  // Action helper to trigger dismissible alert toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Primary API Data fetch orchestrator
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await api.getDashboard(selectedMonth);
      setCarpenters(payload.carpenters || []);
      setMonthData(payload.monthData || {});
      setPrevMonthData(payload.prevMonthData || {});
    } catch (e) {
      showToast(e.message || 'Error fetching records from server!', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calendar navigations
  const handlePrevMonth = () => {
    setSelectedMonth(prev => getPrevMonthStr(prev));
  };

  const handleNextMonth = () => {
    const next = getNextMonthStr(selectedMonth);
    if (next <= maxMonth) {
      setSelectedMonth(next);
    }
  };

  // Add Carpenter Submit
  const handleAddCarpenterSubmit = async (profileData) => {
    try {
      await api.addCarpenter(profileData);
      await loadData();
      setIsAddModalOpen(false);
      showToast('Carpenter profile added!');
    } catch (e) {
      showToast(e.message || 'Failed to add carpenter!', 'error');
    }
  };

  // Edit Carpenter Metadata Submit
  const handleEditCarpenterSubmit = async (profileData) => {
    if (!activeCarpenter) return;
    const id = activeCarpenter._id || activeCarpenter.id;
    try {
      await api.updateCarpenter(id, profileData);
      await loadData();
      setIsEditModalOpen(false);
      setActiveCarpenter(null);
      showToast('Profile updated!');
    } catch (e) {
      showToast(e.message || 'Failed to update profile!', 'error');
    }
  };

  // Delete Carpenter and Ledgers
  const handleDeleteCarpenter = async (id) => {
    try {
      await api.deleteCarpenter(id);
      await loadData();
      setDeletingId(null);
      showToast('Carpenter record deleted!');
    } catch (e) {
      showToast(e.message || 'Failed to delete carpenter!', 'error');
    }
  };

  // Handle visit check click
  const handleToggleVisit = (carpenterId, visitIndex) => {
    const ledger = monthData[carpenterId];
    const visitSlot = ledger?.visits[visitIndex];
    if (!visitSlot) return;

    if (visitSlot.completed) {
      // Completed visit -> Open edit/clear dialogue
      setVisitManageDetails({
        carpenterId,
        visitIndex,
        date: visitSlot.date || getFormattedToday(),
        amount: visitSlot.purchase || ''
      });
    } else {
      // Pending visit -> Open input confirmation dialogue
      setVisitConfirmDetails({
        carpenterId,
        visitIndex,
        date: getFormattedToday(),
        amount: ''
      });
    }
  };

  // Confirm visit entry
  const confirmAndSaveVisit = async (carpenterId, visitIndex, completed, date, amount) => {
    try {
      const updatedRecord = await api.saveVisit({
        carpenterId,
        month: selectedMonth,
        visitIndex,
        completed,
        date,
        amount
      });
      
      setMonthData(prev => ({
        ...prev,
        [carpenterId]: updatedRecord
      }));
      setVisitConfirmDetails(null);
      setVisitManageDetails(null);
      showToast('Visit saved!');
    } catch (e) {
      showToast(e.message || 'Failed to save visit!', 'error');
    }
  };

  // Clear completed visit back to pending
  const handleClearVisit = async () => {
    if (!visitManageDetails) return;
    const { carpenterId, visitIndex } = visitManageDetails;
    try {
      const updatedRecord = await api.saveVisit({
        carpenterId,
        month: selectedMonth,
        visitIndex,
        completed: false,
        date: null,
        amount: 0
      });
      
      setMonthData(prev => ({
        ...prev,
        [carpenterId]: updatedRecord
      }));
      setVisitManageDetails(null);
      showToast('Visit cleared!');
    } catch (e) {
      showToast(e.message || 'Failed to clear visit!', 'error');
    }
  };

  // Input blurred purchase costing
  const handlePurchaseBlur = async (carpenterId, visitIndex, rawValue) => {
    try {
      const amount = Number(rawValue) || 0;
      const updatedRecord = await api.savePurchase({
        carpenterId,
        month: selectedMonth,
        visitIndex,
        amount
      });
      
      setMonthData(prev => ({
        ...prev,
        [carpenterId]: updatedRecord
      }));
      showToast('Purchase updated!');
    } catch (e) {
      showToast(e.message || 'Failed to update purchase!', 'error');
    }
  };

  // Search filtering
  const filteredCarpenters = useMemo(() => {
    return carpenters.filter(carp =>
      carp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carp.phone.includes(searchQuery)
    );
  }, [carpenters, searchQuery]);

  // Aggregate stats
  const totalCarpentersCount = carpenters.length;

  const bonusEligibleCount = useMemo(() => {
    return Object.values(monthData).filter(data => data.bonusEligible).length;
  }, [monthData]);

  const totalPurchasesAmount = useMemo(() => {
    return Object.values(monthData).reduce((sum, data) => sum + (data.totalPurchase || 0), 0);
  }, [monthData]);

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredCarpenters.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    let csvContent = '\uFEFF'; // Excel UTF-8 BOM
    csvContent += '#,Name,Phone,Visits,Purchase(₹),Status\n';

    filteredCarpenters.forEach((carp, index) => {
      const id = carp._id || carp.id;
      const mData = monthData[id] || { totalPurchase: 0, visits: [], bonusEligible: false };
      const completedCount = mData.visits.filter(v => v.completed).length;
      const status = mData.bonusEligible
        ? 'Bonus Eligible'
        : completedCount === 5
        ? 'Completed'
        : 'In Progress';
      
      csvContent += `${index + 1},"${carp.name.replace(/"/g, '""')}","${carp.phone}",${completedCount}/5,${mData.totalPurchase},"${status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const formattedMonth = formatMonthDisplay(selectedMonth).replace(/\s+/g, '_');
    link.setAttribute('download', `SVP_Report_${formattedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded!');
  };

  // Print / PDF Exporter
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker blocked report window!', 'error');
      return;
    }

    const tableRows = filteredCarpenters.map((carp, index) => {
      const id = carp._id || carp.id;
      const mData = monthData[id] || { totalPurchase: 0, visits: [], bonusEligible: false };
      const completedCount = mData.visits.filter(v => v.completed).length;
      const status = mData.bonusEligible ? 'Bonus Eligible' : completedCount === 5 ? 'Completed' : 'In Progress';
      
      let statusColor = '#4B5563'; 
      if (status === 'Bonus Eligible') statusColor = '#059669'; 
      if (status === 'Completed') statusColor = '#2563EB'; 

      return `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #E5E7EB;">
            <div style="font-weight: bold; color: #1F2937;">${carp.name}</div>
            <div style="color: #6B7280; font-size: 11px; margin-top: 2px;">${carp.phone}</div>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #E5E7EB; text-align: center; font-weight: 600;">${completedCount}/5</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 600;">₹${mData.totalPurchase.toLocaleString('en-IN')}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">
            <span style="display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 9999px; background-color: ${statusColor}15; color: ${statusColor};">
              ${status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>SVP Report - ${formatMonthDisplay(selectedMonth)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Playfair+Display:wght@700&display=swap');
            body {
              font-family: 'Lato', sans-serif;
              padding: 40px;
              color: #4A3E3D;
              background-color: #fff;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px double #7B3A10;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #7B3A10;
              font-family: 'Playfair Display', serif;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              margin-top: 4px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .month {
              font-size: 18px;
              font-weight: bold;
              margin-top: 12px;
              color: #D97706;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #7B3A10;
              color: white;
              padding: 12px;
              text-align: left;
              font-size: 12px;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) {
              background-color: #FDF6EE40;
            }
            .footer {
              margin-top: 50px;
              font-size: 11px;
              text-align: right;
              color: #9CA3AF;
              border-top: 1px solid #E5E7EB;
              padding-top: 10px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Sri Vasavi Plywoods</div>
            <div class="subtitle">Carpenter Bonus Tracker — Monthly Report</div>
            <div class="month">${formatMonthDisplay(selectedMonth)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center; border-top-left-radius: 6px;">#</th>
                <th>NAME</th>
                <th style="width: 100px; text-align: center;">VISITS</th>
                <th style="width: 150px; text-align: right;">PURCHASE AMOUNT</th>
                <th style="width: 150px; text-align: center; border-top-right-radius: 6px;">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Report generated via Carpenter Bonus Tracker on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Report generated!');
  };

  return (
    <div className="font-body min-h-screen bg-[#FAF6F0] flex flex-col pb-16 sm:pb-0">
      
      {/* 1. Header component */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSearchQuery={setSearchQuery}
      />

      {/* 2. Primary layout router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col">
        {activeTab === 'dashboard' ? (
          <Dashboard
            isLoading={isLoading}
            selectedMonth={selectedMonth}
            maxMonth={maxMonth}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            totalCarpentersCount={totalCarpentersCount}
            bonusEligibleCount={bonusEligibleCount}
            totalPurchasesAmount={totalPurchasesAmount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredCarpenters={filteredCarpenters}
            onAddClick={() => setIsAddModalOpen(true)}
            onEditClick={(carp) => {
              setActiveCarpenter(carp);
              setIsEditModalOpen(true);
            }}
            onViewClick={(carp) => {
              setActiveCarpenter(carp);
              setIsViewModalOpen(true);
            }}
            onDeleteClick={handleDeleteCarpenter}
            deletingId={deletingId}
            setDeletingId={setDeletingId}
            onToggleVisit={handleToggleVisit}
            onPurchaseBlur={handlePurchaseBlur}
            monthData={monthData}
          />
        ) : (
          <Report
            selectedMonth={selectedMonth}
            maxMonth={maxMonth}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            filteredCarpenters={filteredCarpenters}
            monthData={monthData}
            prevMonthData={prevMonthData}
            handleExportCSV={handleExportCSV}
            handleExportPDF={handleExportPDF}
          />
        )}
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* ========================================== */}
      {/* DIALOG MODALS POPUP OVERLAYS */}
      {/* ========================================== */}
      
      {/* Modal 1: Add Carpenter */}
      <AddCarpenterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCarpenterSubmit}
      />

      {/* Modal 2: Edit Carpenter Profile */}
      <EditCarpenterModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveCarpenter(null);
        }}
        onSubmit={handleEditCarpenterSubmit}
        carpenter={activeCarpenter}
      />

      {/* Modal 3: View Carpenter Visits Details */}
      <ViewCarpenterModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setActiveCarpenter(null);
        }}
        carpenter={activeCarpenter}
        selectedMonth={selectedMonth}
        recordData={activeCarpenter ? monthData[activeCarpenter._id || activeCarpenter.id] : null}
      />

      {/* Modal 4: Confirm visit completions */}
      <VisitConfirmModal
        isOpen={!!visitConfirmDetails}
        onClose={() => setVisitConfirmDetails(null)}
        onSubmit={({ completed, date, amount }) => {
          if (!visitConfirmDetails) return;
          confirmAndSaveVisit(
            visitConfirmDetails.carpenterId,
            visitConfirmDetails.visitIndex,
            completed,
            date,
            amount
          );
        }}
        visitIndex={visitConfirmDetails ? visitConfirmDetails.visitIndex : 0}
        defaultDate={visitConfirmDetails ? visitConfirmDetails.date : ''}
      />

      {/* Modal 5: Completed visit manager */}
      <VisitManageModal
        isOpen={!!visitManageDetails}
        onClose={() => setVisitManageDetails(null)}
        onSubmit={({ completed, date, amount }) => {
          if (!visitManageDetails) return;
          confirmAndSaveVisit(
            visitManageDetails.carpenterId,
            visitManageDetails.visitIndex,
            completed,
            date,
            amount
          );
        }}
        onClear={handleClearVisit}
        visitIndex={visitManageDetails ? visitManageDetails.visitIndex : 0}
        initialDate={visitManageDetails ? visitManageDetails.date : ''}
        initialAmount={visitManageDetails ? visitManageDetails.amount : ''}
      />

      {/* Unified Notification Toast Alerts */}
      <Toast toast={toast} />

      {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#7B3A10] border-t border-white/10 flex justify-around items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] select-none">
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setSearchQuery('');
          }}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#D97706]' : 'text-[#FDF6EE]/75 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">Dashboard</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('report');
            setSearchQuery('');
          }}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 cursor-pointer ${
            activeTab === 'report' ? 'text-[#D97706]' : 'text-[#FDF6EE]/75 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">Report</span>
        </button>
      </div>

      {/* Floating Add Carpenter Button on Mobile FAB (Only on Dashboard) */}
      {activeTab === 'dashboard' && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="sm:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#D97706] hover:bg-[#C26B05] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:scale-90 transition-all z-40 cursor-pointer"
          title="Add Carpenter"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      )}

    </div>
  );
}
