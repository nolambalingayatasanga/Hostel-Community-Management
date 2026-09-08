const mongoose = require('mongoose');

const CustomFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Field slug is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'date', 'select'],
    required: [true, 'Field type is required'],
    default: 'text'
  },
  options: {
    type: [String],
    default: []
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  isInternal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomField', CustomFieldSchema);
