import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutGrid,
  FileText,
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
  Download
} from 'lucide-react';

// Custom Storage API Wrapper with Error Handling
const storage = {
  get: async (key) => {
    try {
      if (window.storage && typeof window.storage.get === 'function') {
        return await window.storage.get(key);
      }
      // Fallback to localStorage if window.storage is not available (for local dev safety)
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      console.error('Error fetching key:', key, e);
      throw e;
    }
  },
  set: async (key, value) => {
    try {
      if (window.storage && typeof window.storage.set === 'function') {
        await window.storage.set(key, value);
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error setting key:', key, e);
      throw e;
    }
  },
  list: async (prefix) => {
    try {
      if (window.storage && typeof window.storage.list === 'function') {
        const keys = await window.storage.list(prefix);
        return keys || [];
      }
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (e) {
      console.error('Error listing prefix:', prefix, e);
      throw e;
    }
  },
  delete: async (key) => {
    try {
      if (window.storage && typeof window.storage.delete === 'function') {
        await window.storage.delete(key);
        return;
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error deleting key:', key, e);
      throw e;
    }
  }
};

// Formatting Helper Functions
const formatMonthDisplay = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getPrevMonthStr = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  let newMonth = month - 1;
  let newYear = year;
  if (newMonth === 0) {
    newMonth = 12;
    newYear -= 1;
  }
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
};

const getNextMonthStr = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  let newMonth = month + 1;
  let newYear = year;
  if (newMonth === 13) {
    newMonth = 1;
    newYear += 1;
  }
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
};

const getFormattedToday = () => {
  const d = new Date();
  const day = d.getDate();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${day} ${monthNames[d.getMonth()]}`;
};

// Initial Month Data Creator
const createInitialMonthData = () => ({
  visits: Array.from({ length: 5 }, (_, i) => ({
    visitNumber: i + 1,
    date: null,
    completed: false
  })),
  purchases: [0, 0, 0, 0, 0],
  totalPurchase: 0,
  bonusEligible: false
});

const BONUS_THRESHOLD = 5000;

export default function App() {
  // Navigation & Tabs State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'report'
  
  // Date tracking: Default to May 2026 as per local context or current system date
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const maxMonth = '2026-05'; // Cap at May 2026

  // Core Data State
  const [carpenters, setCarpenters] = useState([]);
  const [monthData, setMonthData] = useState({}); // { [carpenterId]: data }
  const [prevMonthData, setPrevMonthData] = useState({}); // { [carpenterId]: data }
  const [isLoading, setIsLoading] = useState(true);

  // Modals & UI States
  const [toast, setToast] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeCarpenter, setActiveCarpenter] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Form Input States
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Toggling Visit State
  const [visitConfirmDetails, setVisitConfirmDetails] = useState(null); // { carpenterId, visitIndex, defaultDate, defaultAmount }

  // Inject Styles for Fonts
  useEffect(() => {
    const styleId = 'google-fonts-svp';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
        
        .font-logo {
          font-family: 'Playfair Display', serif;
        }
        .font-body {
          font-family: 'Lato', sans-serif;
        }
        body {
          font-family: 'Lato', sans-serif;
          background-color: #F8F1E8;
          color: #4A3E3D;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Utility to show auto-dismissing Toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load Carpenters list and their monthly data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Get all carpenters
      const keys = await storage.list('carpenter:');
      const carpenterList = [];
      for (const key of keys) {
        const carp = await storage.get(key);
        if (carp) carpenterList.push(carp);
      }
      
      // Sort carpenters by creation date (newest first) or name
      carpenterList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setCarpenters(carpenterList);

      // 2. Get current month data & previous month data for each carpenter
      const currentMonthMap = {};
      const prevMonthMap = {};
      const prevMonthStr = getPrevMonthStr(selectedMonth);

      for (const carp of carpenterList) {
        const currentMonthKey = `data:${carp.id}:${selectedMonth}`;
        const prevMonthKey = `data:${carp.id}:${prevMonthStr}`;

        // Get current month
        let currentData = await storage.get(currentMonthKey);
        if (!currentData) {
          currentData = createInitialMonthData();
          await storage.set(currentMonthKey, currentData);
        }
        currentMonthMap[carp.id] = currentData;

        // Get previous month
        const prevData = await storage.get(prevMonthKey);
        if (prevData) {
          prevMonthMap[carp.id] = prevData;
        }
      }

      setMonthData(currentMonthMap);
      setPrevMonthData(prevMonthMap);
    } catch (e) {
      showToast('Error loading records!', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Month Navigation
  const handlePrevMonth = () => {
    setSelectedMonth(prev => getPrevMonthStr(prev));
  };

  const handleNextMonth = () => {
    const next = getNextMonthStr(selectedMonth);
    if (next <= maxMonth) {
      setSelectedMonth(next);
    }
  };

  // Add Carpenter Action
  const handleAddCarpenterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const newCarpenter = {
        id,
        name: formData.name.trim(),
        phone: formData.phone.trim() || 'No phone',
        createdAt: new Date().toISOString()
      };

      // Store carpenter metadata
      await storage.set(`carpenter:${id}`, newCarpenter);

      // Initialize monthly data for current month
      const initialData = createInitialMonthData();
      await storage.set(`data:${id}:${selectedMonth}`, initialData);

      // Refresh data
      await loadData();
      
      setIsAddModalOpen(false);
      setFormData({ name: '', phone: '' });
      showToast('Carpenter added!');
    } catch (e) {
      showToast('Error adding carpenter!', 'error');
    }
  };

  // Edit Carpenter Action
  const handleEditCarpenterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !activeCarpenter) return;

    try {
      const updated = {
        ...activeCarpenter,
        name: formData.name.trim(),
        phone: formData.phone.trim()
      };

      await storage.set(`carpenter:${activeCarpenter.id}`, updated);
      await loadData();
      
      setIsEditModalOpen(false);
      setActiveCarpenter(null);
      setFormData({ name: '', phone: '' });
      showToast('Carpenter updated!');
    } catch (e) {
      showToast('Error saving updates!', 'error');
    }
  };

  // Delete Carpenter Action
  const handleDeleteCarpenter = async (id) => {
    try {
      // 1. Delete carpenter metadata
      await storage.delete(`carpenter:${id}`);

      // 2. Delete all historical monthly data for this carpenter
      const dataKeys = await storage.list(`data:${id}:`);
      for (const k of dataKeys) {
        await storage.delete(k);
      }

      await loadData();
      setDeletingId(null);
      showToast('Carpenter deleted!');
    } catch (e) {
      showToast('Error deleting carpenter!', 'error');
    }
  };

  // Toggle Visit Completion (Complete or Clear)
  const handleToggleVisit = (carpenterId, visitIndex) => {
    const currentStatus = monthData[carpenterId]?.visits[visitIndex];
    if (!currentStatus) return;

    if (currentStatus.completed) {
      // Un-completing → Clear slot data directly
      confirmAndSaveVisit(carpenterId, visitIndex, false, null, 0);
    } else {
      // Completing → Open confirmation modal to enter date and purchase amount
      setVisitConfirmDetails({
        carpenterId,
        visitIndex,
        date: getFormattedToday(),
        amount: ''
      });
    }
  };

  // Commit Visit Change
  const confirmAndSaveVisit = async (carpenterId, visitIndex, completed, date, amount) => {
    try {
      const currentData = JSON.parse(JSON.stringify(monthData[carpenterId]));
      
      // Update specific visit slot
      currentData.visits[visitIndex] = {
        visitNumber: visitIndex + 1,
        date: completed ? date : null,
        completed
      };

      // Update specific purchase amount
      currentData.purchases[visitIndex] = completed ? Number(amount) || 0 : 0;

      // Recalculate totalPurchase
      currentData.totalPurchase = currentData.purchases.reduce((acc, curr) => acc + curr, 0);

      // Recalculate bonus eligibility: completed visits count must be 5 AND total purchase >= threshold
      const completedCount = currentData.visits.filter(v => v.completed).length;
      currentData.bonusEligible = completedCount === 5 && currentData.totalPurchase >= BONUS_THRESHOLD;

      // Save to storage
      await storage.set(`data:${carpenterId}:${selectedMonth}`, currentData);
      
      // Update UI state
      setMonthData(prev => ({
        ...prev,
        [carpenterId]: currentData
      }));
      setVisitConfirmDetails(null);
      showToast('Data saved!');
    } catch (e) {
      showToast('Error saving data!', 'error');
    }
  };

  // Input Purchase Value blur update
  const handlePurchaseBlur = async (carpenterId, visitIndex, rawValue) => {
    try {
      const amount = Number(rawValue) || 0;
      const currentData = JSON.parse(JSON.stringify(monthData[carpenterId]));
      
      // Save amount
      currentData.purchases[visitIndex] = amount;
      
      // Re-sum totalPurchase
      currentData.totalPurchase = currentData.purchases.reduce((acc, curr) => acc + curr, 0);
      
      // Recalculate bonus eligibility
      const completedCount = currentData.visits.filter(v => v.completed).length;
      currentData.bonusEligible = completedCount === 5 && currentData.totalPurchase >= BONUS_THRESHOLD;

      // Save
      await storage.set(`data:${carpenterId}:${selectedMonth}`, currentData);
      setMonthData(prev => ({
        ...prev,
        [carpenterId]: currentData
      }));
      showToast('Purchase updated!');
    } catch (e) {
      showToast('Error saving purchase!', 'error');
    }
  };

  // Search filter
  const filteredCarpenters = useMemo(() => {
    return carpenters.filter(carp =>
      carp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carp.phone.includes(searchQuery)
    );
  }, [carpenters, searchQuery]);

  // Aggregate Metrics for selected month
  const totalCarpentersCount = carpenters.length;
  
  const bonusEligibleCount = useMemo(() => {
    return Object.values(monthData).filter(data => data.bonusEligible).length;
  }, [monthData]);

  const totalPurchasesAmount = useMemo(() => {
    return Object.values(monthData).reduce((sum, data) => sum + (data.totalPurchase || 0), 0);
  }, [monthData]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredCarpenters.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Hindi/Rupee symbol readability
    csvContent += '#,Name,Phone,Visits,Purchase(₹),Status\n';

    filteredCarpenters.forEach((carp, index) => {
      const mData = monthData[carp.id] || { totalPurchase: 0, visits: [], bonusEligible: false };
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
    
    // Clean formatted month name for filename
    const formattedMonth = formatMonthDisplay(selectedMonth).replace(/\s+/g, '_');
    link.setAttribute('download', `SVP_Report_${formattedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded!');
  };

  // Export PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker blocked report window!', 'error');
      return;
    }

    const tableRows = filteredCarpenters.map((carp, index) => {
      const mData = monthData[carp.id] || { totalPurchase: 0, visits: [], bonusEligible: false };
      const completedCount = mData.visits.filter(v => v.completed).length;
      const status = mData.bonusEligible ? 'Bonus Eligible' : completedCount === 5 ? 'Completed' : 'In Progress';
      
      let statusColor = '#4B5563'; // In Progress (muted gray)
      if (status === 'Bonus Eligible') statusColor = '#059669'; // Green
      if (status === 'Completed') statusColor = '#2563EB'; // Blue

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
              // close print window once done (most browsers block auto-close, but safe to include)
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
    <div className="font-body min-h-screen bg-[#F5ECE2] md:py-6 flex flex-col items-center">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[430px] min-h-screen md:min-h-[880px] md:rounded-[40px] md:shadow-2xl bg-[#FDF6EE] flex flex-col relative overflow-hidden border border-[#E6D4C0]">
        
        {/* UPPER HEADER BAR */}
        <header className="bg-[#7B3A10] text-white px-4 py-4 flex items-center shadow-md select-none">
          {/* Square Logo */}
          <div className="w-10 h-10 bg-[#D97706] rounded-xl flex items-center justify-center font-logo font-black text-lg mr-3 shadow-inner tracking-wider">
            SVP
          </div>
          <div className="flex flex-col">
            <span className="font-logo font-bold text-lg leading-tight tracking-wide">
              Sri Vasavi Plywoods
            </span>
            <span className="text-[#FDF6EE] text-xs font-light tracking-widest uppercase opacity-85">
              Carpenter Bonus Tracker
            </span>
          </div>
        </header>

        {/* MAIN BODY CONTENT AREA */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="fade-in space-y-5">
              
              {/* MONTH NAVIGATOR */}
              <div className="bg-white rounded-2xl border border-[#F5E6D3] px-3 py-3 flex items-center justify-between shadow-sm">
                <button
                  onClick={handlePrevMonth}
                  className="w-10 h-10 rounded-xl hover:bg-[#FDF6EE] flex items-center justify-center transition-colors text-[#7B3A10] active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
                
                <span className="font-logo text-[#7B3A10] font-black text-base tracking-wide select-none">
                  {formatMonthDisplay(selectedMonth)}
                </span>
                
                <button
                  onClick={handleNextMonth}
                  disabled={getNextMonthStr(selectedMonth) > maxMonth}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
                    getNextMonthStr(selectedMonth) > maxMonth
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-[#FDF6EE] text-[#7B3A10]'
                  }`}
                >
                  <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>

              {/* THREE SUMMARY CARDS ROW */}
              <div className="grid grid-cols-3 gap-2">
                {/* Total Carpenters */}
                <div className="bg-white rounded-2xl border border-[#F5E6D3] p-3 flex flex-col items-center justify-center text-center shadow-sm select-none">
                  <div className="w-9 h-9 bg-[#FDF6EE] text-[#7B3A10] rounded-full flex items-center justify-center mb-1.5">
                    <Search className="w-4 h-4" /> {/* Simple search/lookup icon resembling carpenter profile */}
                  </div>
                  <span className="font-logo text-lg font-black text-[#7B3A10] leading-none">
                    {totalCarpentersCount}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium tracking-tight mt-1">
                    Carpenters
                  </span>
                </div>

                {/* Bonus Eligible */}
                <div className="bg-white rounded-2xl border border-[#F5E6D3] p-3 flex flex-col items-center justify-center text-center shadow-sm select-none">
                  <div className="w-9 h-9 bg-[#FFFBEB] text-[#D97706] rounded-full flex items-center justify-center mb-1.5">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-logo text-lg font-black text-[#D97706] leading-none">
                    {bonusEligibleCount}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium tracking-tight mt-1">
                    Bonus Eligible
                  </span>
                </div>

                {/* Total Purchases */}
                <div className="bg-white rounded-2xl border border-[#F5E6D3] p-3 flex flex-col items-center justify-center text-center shadow-sm select-none">
                  <div className="w-9 h-9 bg-[#FDF6EE] text-[#7B3A10] rounded-full flex items-center justify-center mb-1.5 font-bold text-sm">
                    ₹
                  </div>
                  <span className="font-logo text-base font-black text-[#7B3A10] leading-none truncate max-w-full">
                    ₹{totalPurchasesAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium tracking-tight mt-1">
                    Total Purchases
                  </span>
                </div>
              </div>

              {/* SEARCH BAR */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search carpenter by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E6D4C0] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] text-[#4A3E3D] transition-all placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* CARPENTERS LIST SECTION */}
              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#8E7E7A] uppercase mb-3 px-1 select-none">
                  Carpenters
                </h3>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#8E7E7A] space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#D97706]" />
                    <span className="text-sm">Loading records...</span>
                  </div>
                ) : filteredCarpenters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-[#F5E6D3] p-6 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#FDF6EE] flex items-center justify-center text-[#D97706] mb-3">
                      <LayoutGrid className="w-6 h-6 opacity-60" />
                    </div>
                    {carpenters.length === 0 ? (
                      <>
                        <p className="text-[#7B3A10] font-bold text-base">No carpenters yet</p>
                        <p className="text-sm text-gray-400 mt-1 max-w-[240px]">
                          Tap the orange + button below to add your first carpenter.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[#7B3A10] font-bold text-base">No results found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try searching with a different name or number.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCarpenters.map((carpenter, idx) => {
                      const cData = monthData[carpenter.id] || createInitialMonthData();
                      const completedVisitsCount = cData.visits.filter(v => v.completed).length;

                      return (
                        <div
                          key={carpenter.id}
                          className="bg-white rounded-2xl border border-[#F5E6D3] p-4 shadow-sm relative transition-all"
                        >
                          {/* Top Row with Profile and Actions */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3 max-w-[70%]">
                              {/* Number Badge */}
                              <div className="w-7 h-7 bg-[#FDF6EE] text-[#7B3A10] font-bold text-xs rounded-full flex items-center justify-center shrink-0 border border-[#F5E6D3]">
                                {idx + 1}
                              </div>
                              <div className="truncate">
                                <h4 className="font-bold text-[#4A3E3D] text-sm md:text-base leading-tight truncate">
                                  {carpenter.name}
                                </h4>
                                <p className="text-xs text-gray-400 tracking-wide mt-0.5">
                                  {carpenter.phone}
                                </p>
                              </div>
                            </div>

                            {/* Actions Group / Inline Confirmation */}
                            {deletingId === carpenter.id ? (
                              <div className="flex items-center space-x-2 text-xs bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl shadow-sm">
                                <span className="text-red-700 font-bold">Sure?</span>
                                <button
                                  onClick={() => handleDeleteCarpenter(carpenter.id)}
                                  className="text-red-600 font-extrabold hover:underline"
                                >
                                  Yes
                                </button>
                                <span className="text-gray-300">/</span>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="text-gray-500 font-medium hover:underline"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-0.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setActiveCarpenter(carpenter);
                                    setIsViewModalOpen(true);
                                  }}
                                  title="View Details"
                                  className="p-2 hover:bg-[#FDF6EE] rounded-full text-[#D97706] transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveCarpenter(carpenter);
                                    setFormData({ name: carpenter.name, phone: carpenter.phone });
                                    setIsEditModalOpen(true);
                                  }}
                                  title="Edit Profile"
                                  className="p-2 hover:bg-[#FDF6EE] rounded-full text-gray-500 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingId(carpenter.id)}
                                  title="Delete Carpenter"
                                  className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* VISITS AREA */}
                          <div className="border-t border-[#F5E6D3] pt-3.5">
                            <span className="text-[10px] font-bold tracking-wider text-gray-400 block mb-2 px-0.5">
                              VISITS
                            </span>

                            {/* 5 Visit Circles Row */}
                            <div className="grid grid-cols-5 gap-2.5 mb-4">
                              {cData.visits.map((visit, vIdx) => (
                                <div key={vIdx} className="flex flex-col items-center">
                                  <span className="text-[10px] text-gray-400 font-medium mb-1 select-none">
                                    V{vIdx + 1}
                                  </span>
                                  <button
                                    onClick={() => handleToggleVisit(carpenter.id, vIdx)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                      visit.completed
                                        ? 'bg-[#D97706] border-[#D97706] text-white shadow-sm ring-2 ring-[#D97706]/10 scale-105'
                                        : 'bg-[#FDF6EE]/60 hover:bg-[#FDF6EE] border-[#E6D4C0] text-transparent'
                                    }`}
                                  >
                                    <Check className="w-5 h-5 stroke-[3]" />
                                  </button>
                                  {visit.completed && visit.date && (
                                    <span className="text-[9px] text-[#D97706] font-bold mt-1 tracking-tighter truncate text-center max-w-full">
                                      {visit.date}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Purchase Inputs (Only display input boxes for completed visits) */}
                            {completedVisitsCount > 0 && (
                              <div className="grid grid-cols-5 gap-2.5 mb-3 bg-[#FDF6EE]/40 border border-[#F5E6D3] rounded-xl p-2">
                                {cData.visits.map((visit, vIdx) => (
                                  <div key={vIdx} className="flex flex-col justify-end">
                                    {visit.completed ? (
                                      <div className="relative">
                                        <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-[10px] font-bold text-[#8E7E7A]">
                                          ₹
                                        </span>
                                        <input
                                          type="number"
                                          defaultValue={cData.purchases[vIdx] || ''}
                                          placeholder="0"
                                          onBlur={(e) => handlePurchaseBlur(carpenter.id, vIdx, e.target.value)}
                                          className="w-full bg-white border border-[#E6D4C0] rounded-lg pl-3 pr-1 py-1 text-[11px] font-bold focus:outline-none focus:border-[#D97706] text-right focus:ring-1 focus:ring-[#D97706]"
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-6 w-full bg-gray-100/40 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                                        <span className="text-[9px] text-gray-300">—</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Bottom stats within Card */}
                            <div className="flex justify-between items-center mt-2.5">
                              <span className="font-logo font-black text-sm text-[#7B3A10] select-none">
                                Total: ₹{cData.totalPurchase.toLocaleString('en-IN')}
                              </span>

                              {/* Progress Badge */}
                              <div
                                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold select-none ${
                                  cData.bonusEligible
                                    ? 'bg-[#D1FAE5] text-[#065F46] ring-1 ring-[#065F46]/20'
                                    : completedVisitsCount === 5
                                    ? 'bg-[#DBEAFE] text-[#1E40AF] ring-1 ring-[#1E40AF]/20'
                                    : 'bg-[#F3F4F6] text-[#374151]'
                                }`}
                              >
                                {cData.bonusEligible ? (
                                  <>
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    <span>5/5 Eligible</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className={`w-3.5 h-3.5 ${completedVisitsCount > 0 && completedVisitsCount < 5 ? 'animate-spin' : ''}`} />
                                    <span>{completedVisitsCount}/5</span>
                                  </>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REPORTS */}
          {activeTab === 'report' && (
            <div className="fade-in space-y-5">
              
              {/* MONTH NAVIGATOR (SYNCED) */}
              <div className="bg-white rounded-2xl border border-[#F5E6D3] px-3 py-3 flex items-center justify-between shadow-sm">
                <button
                  onClick={handlePrevMonth}
                  className="w-10 h-10 rounded-xl hover:bg-[#FDF6EE] flex items-center justify-center transition-colors text-[#7B3A10] active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
                
                <span className="font-logo text-[#7B3A10] font-black text-base tracking-wide select-none">
                  {formatMonthDisplay(selectedMonth)}
                </span>
                
                <button
                  onClick={handleNextMonth}
                  disabled={getNextMonthStr(selectedMonth) > maxMonth}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
                    getNextMonthStr(selectedMonth) > maxMonth
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-[#FDF6EE] text-[#7B3A10]'
                  }`}
                >
                  <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>

              {/* EXPORT ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center space-x-2 py-3 px-4 bg-white border border-[#E6D4C0] hover:bg-[#FDF6EE] rounded-xl text-sm font-bold text-[#7B3A10] shadow-sm active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="flex items-center justify-center space-x-2 py-3 px-4 bg-white border border-[#E6D4C0] hover:bg-[#FDF6EE] rounded-xl text-sm font-bold text-[#7B3A10] shadow-sm active:scale-95 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>

              {/* DATA TABLE */}
              <div className="bg-white rounded-2xl border border-[#F5E6D3] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#7B3A10]/5 text-[#8E7E7A] text-[10px] font-bold tracking-wider uppercase border-b border-[#F5E6D3] select-none">
                        <th className="py-3 px-3 text-center w-8">#</th>
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2 text-center">Visits</th>
                        <th className="py-3 px-2 text-right">Purchase</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCarpenters.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-gray-400 text-sm">
                            No records to display.
                          </td>
                        </tr>
                      ) : (
                        filteredCarpenters.map((carp, idx) => {
                          const mData = monthData[carp.id] || createInitialMonthData();
                          const completedCount = mData.visits.filter(v => v.completed).length;
                          
                          // Prior monthly record details calculation
                          const prevMonthStr = getPrevMonthStr(selectedMonth);
                          const pData = prevMonthData[carp.id];
                          const prevCompleted = pData ? pData.visits.filter(v => v.completed).length : null;
                          const prevTotal = pData ? pData.totalPurchase : null;

                          return (
                            <tr key={carp.id} className="border-b border-[#F5E6D3]/60 hover:bg-[#FDF6EE]/30 last:border-0 transition-colors">
                              {/* Row Index */}
                              <td className="py-3.5 px-3 text-center text-xs font-bold text-gray-400">
                                {idx + 1}
                              </td>

                              {/* Carpenter details */}
                              <td className="py-3.5 px-2 max-w-[130px]">
                                <div className="font-bold text-[#4A3E3D] text-xs md:text-sm truncate">
                                  {carp.name}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {carp.phone}
                                </div>
                                
                                {/* Last Month comparative subtitle */}
                                {pData && prevCompleted !== null && (
                                  <div className="text-[9px] text-[#A78BFA] font-bold mt-1 bg-purple-50 inline-block px-1.5 py-0.5 rounded-md">
                                    Last month: {prevCompleted}/5 — ₹{prevTotal.toLocaleString('en-IN')}
                                  </div>
                                )}
                              </td>

                              {/* Visits Completion */}
                              <td className="py-3.5 px-2 text-center text-xs font-bold text-[#7B3A10]">
                                {completedCount}/5
                              </td>

                              {/* Total Purchases */}
                              <td className="py-3.5 px-2 text-right text-xs font-bold text-[#4A3E3D]">
                                ₹{mData.totalPurchase.toLocaleString('en-IN')}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-3 text-center">
                                <div className="flex justify-center">
                                  {mData.bonusEligible ? (
                                    <div
                                      title="Bonus Eligible"
                                      className="bg-[#D1FAE5] text-[#065F46] p-1.5 rounded-full flex items-center justify-center ring-1 ring-[#065F46]/20"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-current" />
                                    </div>
                                  ) : completedCount === 5 ? (
                                    <div
                                      title="Completed (Below Threshold)"
                                      className="bg-[#DBEAFE] text-[#1E40AF] p-1.5 rounded-full flex items-center justify-center ring-1 ring-[#1E40AF]/20"
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div
                                      title="In Progress"
                                      className="bg-gray-100 text-gray-400 p-1.5 rounded-full flex items-center justify-center"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* BOTTOM NAVIGATION TAB BAR */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#F0E2D5] h-16 flex items-center justify-around px-6 z-10 select-none shadow-lg">
          {/* Dashboard Tab link */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-[#D97706] scale-105'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <LayoutGrid className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] font-bold mt-1">Dashboard</span>
          </button>

          {/* Report Tab link */}
          <button
            onClick={() => {
              setActiveTab('report');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
              activeTab === 'report'
                ? 'text-[#D97706] scale-105'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FileText className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] font-bold mt-1">Report</span>
          </button>
        </nav>

        {/* FLOATING ACTION BUTTON (ADD CARPENTER) */}
        {activeTab === 'dashboard' && (
          <button
            onClick={() => {
              setFormData({ name: '', phone: '' });
              setIsAddModalOpen(true);
            }}
            className="absolute bottom-20 right-4 w-12 h-12 bg-[#D97706] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-20"
            title="Add New Carpenter"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        )}

        {/* ======================================================== */}
        {/* MODAL 1: ADD CARPENTER */}
        {/* ======================================================== */}
        {isAddModalOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in">
            <div className="bg-white w-full rounded-t-[30px] p-6 pb-8 space-y-4 max-w-[430px] shadow-2xl border-t border-[#F5E6D3] animate-slide-up">
              <div className="flex justify-between items-center border-b border-[#F5E6D3] pb-3">
                <h3 className="font-logo font-bold text-lg text-[#7B3A10]">
                  Add New Carpenter
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#FDF6EE] flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCarpenterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ca Palani Srinivasapuram"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#FDF6EE]/60 border border-[#E6D4C0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] text-[#4A3E3D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +917305757038"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#FDF6EE]/60 border border-[#E6D4C0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] text-[#4A3E3D]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#D97706] text-white font-bold rounded-xl shadow-md hover:opacity-95 active:scale-98 transition-all"
                  >
                    Save Carpenter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 2: EDIT CARPENTER */}
        {/* ======================================================== */}
        {isEditModalOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in">
            <div className="bg-white w-full rounded-t-[30px] p-6 pb-8 space-y-4 max-w-[430px] shadow-2xl border-t border-[#F5E6D3] animate-slide-up">
              <div className="flex justify-between items-center border-b border-[#F5E6D3] pb-3">
                <h3 className="font-logo font-bold text-lg text-[#7B3A10]">
                  Edit Carpenter Profile
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setActiveCarpenter(null);
                  }}
                  className="w-8 h-8 rounded-full bg-[#FDF6EE] flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditCarpenterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ca Palani Srinivasapuram"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#FDF6EE]/60 border border-[#E6D4C0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] text-[#4A3E3D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +917305757038"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#FDF6EE]/60 border border-[#E6D4C0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] text-[#4A3E3D]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#D97706] text-white font-bold rounded-xl shadow-md hover:opacity-95 active:scale-98 transition-all"
                  >
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: VIEW CARPENTER DETAILS */}
        {/* ======================================================== */}
        {isViewModalOpen && activeCarpenter && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white w-full rounded-[24px] p-5 max-w-[380px] shadow-2xl border border-[#F5E6D3] space-y-4 animate-scale-up">
              <div className="flex justify-between items-start border-b border-[#F5E6D3] pb-3.5">
                <div>
                  <h3 className="font-logo font-bold text-base text-[#7B3A10]">
                    {activeCarpenter.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {activeCarpenter.phone}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setActiveCarpenter(null);
                  }}
                  className="w-7 h-7 rounded-full bg-[#FDF6EE] flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Monthly detail inside visual card */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold">Month</span>
                  <span className="text-[#7B3A10] font-black">{formatMonthDisplay(selectedMonth)}</span>
                </div>

                <div className="border border-[#F5E6D3] rounded-xl p-3 bg-[#FDF6EE]/30 space-y-2">
                  <span className="text-[10px] font-bold text-[#8E7E7A] tracking-wider uppercase block">
                    Visits & Purchases Timeline
                  </span>

                  <div className="space-y-2">
                    {(monthData[activeCarpenter.id] || createInitialMonthData()).visits.map((v, idx) => {
                      const amount = (monthData[activeCarpenter.id] || createInitialMonthData()).purchases[idx];
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                          <div className="flex items-center space-x-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              v.completed ? 'bg-[#D97706] text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className="font-medium text-gray-600">Visit {idx + 1}</span>
                          </div>
                          
                          <div className="text-right">
                            {v.completed ? (
                              <>
                                <span className="font-bold text-[#4A3E3D]">₹{amount.toLocaleString('en-IN')}</span>
                                <span className="text-[9px] text-[#D97706] font-bold block">{v.date}</span>
                              </>
                            ) : (
                              <span className="text-gray-300 font-medium italic">Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Total Purchases</span>
                    <span className="text-[#7B3A10] font-black text-base">
                      ₹{(monthData[activeCarpenter.id] || createInitialMonthData()).totalPurchase.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Bonus Eligible</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold leading-none ${
                      (monthData[activeCarpenter.id] || createInitialMonthData()).bonusEligible
                        ? 'bg-[#D1FAE5] text-[#065F46]'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {(monthData[activeCarpenter.id] || createInitialMonthData()).bonusEligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 4: VISIT CONFIRMATION DIALOG */}
        {/* ======================================================== */}
        {visitConfirmDetails && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white w-full rounded-[24px] p-5 max-w-[340px] shadow-2xl border border-[#F5E6D3] space-y-4 animate-scale-up">
              <h4 className="font-logo font-bold text-base text-[#7B3A10] border-b border-[#F5E6D3] pb-2.5">
                Complete Visit {visitConfirmDetails.visitIndex + 1}
              </h4>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                    Visit Date
                  </label>
                  <input
                    type="text"
                    value={visitConfirmDetails.date}
                    onChange={(e) => setVisitConfirmDetails(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-[#FDF6EE]/60 border border-[#E6D4C0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#4A3E3D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                    Purchase Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={visitConfirmDetails.amount}
                    onChange={(e) => setVisitConfirmDetails(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-[#FDF6EE]/60 border border-[#E6D4C0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#4A3E3D] focus:outline-none focus:border-[#D97706]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setVisitConfirmDetails(null)}
                  className="flex-1 py-2.5 border border-[#E6D4C0] hover:bg-gray-50 rounded-xl text-xs font-bold text-[#8E7E7A]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmAndSaveVisit(
                    visitConfirmDetails.carpenterId,
                    visitConfirmDetails.visitIndex,
                    true,
                    visitConfirmDetails.date,
                    visitConfirmDetails.amount
                  )}
                  className="flex-1 py-2.5 bg-[#D97706] text-white hover:opacity-95 rounded-xl text-xs font-bold shadow-md"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST SYSTEM POPUP */}
        {toast && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-[#4A3E3D] text-[#FDF6EE] px-4 py-2.5 rounded-full text-xs font-bold shadow-lg z-50 tracking-wide select-none animate-slide-up flex items-center space-x-1.5 min-w-[140px] justify-center">
            {toast.type === 'success' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
            ) : (
              <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

      </div>
    </div>
  );
}
