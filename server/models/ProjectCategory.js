const mongoose = require('mongoose');

const ProjectCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'TagIcon'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

ProjectCategorySchema.statics.seedDefaults = async function() {
  const count = await this.countDocuments();
  if (count > 0) return;

  const defaults = [
    { name: 'Web Development', icon: 'LanguageIcon', order: 1 },
    { name: 'Mobile Apps', icon: 'MobileIcon', order: 2 },
    { name: 'AI / ML', icon: 'AiIcon', order: 3 },
    { name: 'Cloud & DevOps', icon: 'CloudIcon', order: 4 },
    { name: 'IoT & Hardware', icon: 'HardwareIcon', order: 5 },
    { name: 'Cybersecurity', icon: 'SecurityIcon', order: 6 },
    { name: 'Open Source', icon: 'CodeIcon', order: 7 },
    { name: 'Other', icon: 'TagIcon', order: 8 }
  ];

  try {
    await this.insertMany(defaults);
    console.log('[ProjectCategory] Seeded default project categories');
  } catch (err) {
    console.error('[ProjectCategory] Error seeding default categories:', err.message);
  }
};

module.exports = mongoose.model('ProjectCategory', ProjectCategorySchema);
