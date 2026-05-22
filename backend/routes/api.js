import express from 'express';
import Carpenter from '../models/Carpenter.js';
import MonthlyRecord from '../models/MonthlyRecord.js';

const router = express.Router();

const BONUS_THRESHOLD = 5000;

// Helper to get previous month string
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

// Helper to create blank month ledger structure
const createInitialMonthData = (carpenterId, month) => {
  return {
    carpenterId,
    month,
    visits: Array.from({ length: 5 }, (_, i) => ({
      visitNumber: i + 1,
      completed: false,
      date: null,
      purchase: 0
    })),
    totalPurchase: 0,
    bonusEligible: false
  };
};

/**
 * GET /api/dashboard
 * Query Params: month (e.g. 2026-05)
 * Returns: { carpenters: [...], monthData: { [id]: ledger }, prevMonthData: { [id]: ledger } }
 */
router.get('/dashboard', async (req, res) => {
  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Valid month query parameter (YYYY-MM) is required' });
  }

  try {
    const carpenters = await Carpenter.find({}).sort({ createdAt: -1 });
    
    const monthData = {};
    const prevMonthData = {};
    const prevMonth = getPrevMonthStr(month);

    for (const carp of carpenters) {
      const id = carp._id;

      // 1. Fetch current month record
      let currentRec = await MonthlyRecord.findOne({ carpenterId: id, month });
      if (!currentRec) {
        // Automatically initialize blank ledger in DB
        currentRec = new MonthlyRecord(createInitialMonthData(id, month));
        await currentRec.save();
      }
      monthData[id] = currentRec;

      // 2. Fetch prior month record (read-only comparison, no auto-creation)
      const prevRec = await MonthlyRecord.findOne({ carpenterId: id, month: prevMonth });
      if (prevRec) {
        prevMonthData[id] = prevRec;
      }
    }

    res.json({
      carpenters,
      monthData,
      prevMonthData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard records' });
  }
});

/**
 * POST /api/carpenters
 * Body: { name, phone }
 */
router.post('/carpenters', async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required' });
  }

  try {
    // Save Carpenter metadata profile
    const newCarpenter = new Carpenter({ name, phone });
    await newCarpenter.save();
    
    res.status(201).json(newCarpenter);
  } catch (error) {
    console.error('Error adding carpenter:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Phone number is already registered' });
    }
    res.status(500).json({ error: error.message || 'Failed to add carpenter profile' });
  }
});

/**
 * PUT /api/carpenters/:id
 * Body: { name, phone }
 */
router.put('/carpenters/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  try {
    const updated = await Carpenter.findByIdAndUpdate(
      id,
      { name, phone },
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating carpenter:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Phone number is already registered' });
    }
    res.status(500).json({ error: error.message || 'Failed to update carpenter profile' });
  }
});

/**
 * DELETE /api/carpenters/:id
 */
router.delete('/carpenters/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Carpenter.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }

    // Delete all ledger sheets for this carpenter
    await MonthlyRecord.deleteMany({ carpenterId: id });
    
    res.json({ message: 'Carpenter and all associated monthly logs deleted successfully' });
  } catch (error) {
    console.error('Error deleting carpenter:', error);
    res.status(500).json({ error: 'Failed to delete carpenter profile' });
  }
});

/**
 * POST /api/records/visit
 * Body: { carpenterId, month, visitIndex, completed, date, amount }
 */
router.post('/records/visit', async (req, res) => {
  const { carpenterId, month, visitIndex, completed, date, amount } = req.body;

  if (carpenterId == null || !month || visitIndex == null) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    let record = await MonthlyRecord.findOne({ carpenterId, month });
    if (!record) {
      record = new MonthlyRecord(createInitialMonthData(carpenterId, month));
    }

    // 1. Update specific visit slot
    const visitNo = Number(visitIndex) + 1;
    const vIndex = Number(visitIndex);

    record.visits[vIndex] = {
      visitNumber: visitNo,
      completed: !!completed,
      date: completed ? date : null,
      purchase: completed ? Number(amount) || 0 : 0
    };

    // Update individual purchase tracker parallel cache
    // Let's re-sync totalPurchase
    record.totalPurchase = record.visits.reduce((sum, v) => sum + (v.purchase || 0), 0);

    // 2. Compute bonus eligibility (Exactly 5 completed visits AND totalPurchase >= threshold)
    const completedCount = record.visits.filter(v => v.completed).length;
    record.bonusEligible = completedCount === 5 && record.totalPurchase >= BONUS_THRESHOLD;

    await record.save();
    res.json(record);
  } catch (error) {
    console.error('Error saving visit transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to register visit transaction' });
  }
});

/**
 * POST /api/records/purchase
 * Body: { carpenterId, month, visitIndex, amount }
 */
router.post('/records/purchase', async (req, res) => {
  const { carpenterId, month, visitIndex, amount } = req.body;

  if (carpenterId == null || !month || visitIndex == null) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    let record = await MonthlyRecord.findOne({ carpenterId, month });
    if (!record) {
      return res.status(404).json({ error: 'Monthly record ledger sheet not found' });
    }

    const vIndex = Number(visitIndex);
    if (!record.visits[vIndex] || !record.visits[vIndex].completed) {
      return res.status(400).json({ error: 'Cannot record purchase details on a pending visit slot' });
    }

    // Update purchase value
    record.visits[vIndex].purchase = Number(amount) || 0;

    // Recalculate totals
    record.totalPurchase = record.visits.reduce((sum, v) => sum + (v.purchase || 0), 0);

    // Compute eligibility
    const completedCount = record.visits.filter(v => v.completed).length;
    record.bonusEligible = completedCount === 5 && record.totalPurchase >= BONUS_THRESHOLD;

    await record.save();
    res.json(record);
  } catch (error) {
    console.error('Error updating purchase value:', error);
    res.status(500).json({ error: error.message || 'Failed to update purchase amount' });
  }
});

export default router;
