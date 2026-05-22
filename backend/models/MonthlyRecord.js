import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
  visitNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: String,
    default: null
  },
  purchase: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const MonthlyRecordSchema = new mongoose.Schema({
  carpenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carpenter',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
  },
  visits: {
    type: [VisitSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length === 5;
      },
      message: 'Visits list must have exactly 5 entries'
    }
  },
  totalPurchase: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  bonusEligible: {
    type: Boolean,
    required: true,
    default: false
  }
});

// Compound unique index to prevent a carpenter from having multiple ledgers in the same month
MonthlyRecordSchema.index({ carpenterId: 1, month: 1 }, { unique: true });

export default mongoose.model('MonthlyRecord', MonthlyRecordSchema);
