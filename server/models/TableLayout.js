const mongoose = require('mongoose');

const TableLayoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tabId: {
    type: String,
    required: true,
    trim: true
  },
  columnOrder: [{
    type: String,
    trim: true
  }],
  hiddenColumns: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

TableLayoutSchema.index({ user: 1, tabId: 1 }, { unique: true });

module.exports = mongoose.model('TableLayout', TableLayoutSchema);
