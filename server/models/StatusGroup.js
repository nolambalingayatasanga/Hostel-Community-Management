const mongoose = require('mongoose');

const StatusGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Status group name is required'],
    trim: true,
    unique: true
  },
  order: {
    type: Number,
    default: 0
  },
  statuses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('StatusGroup', StatusGroupSchema);
