const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Status name is required'],
    trim: true
  },
  description: {
    type: String,
    default: 'No description'
  },
  statusGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatusGroup',
    required: [true, 'Status group is required']
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Status', StatusSchema);
