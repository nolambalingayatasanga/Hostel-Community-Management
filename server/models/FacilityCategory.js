const mongoose = require('mongoose');

const FacilityCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'ApartmentIcon'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

FacilityCategorySchema.statics.seedDefaults = async function() {
  const count = await this.countDocuments();
  if (count > 0) return;

  const defaults = [
    { name: 'Food & Dining', icon: 'FoodIcon', order: 1 },
    { name: 'Internet & Wi-Fi', icon: 'WifiIcon', order: 2 },
    { name: 'Parking', icon: 'ParkingIcon', order: 3 },
    { name: 'Library & Study', icon: 'LibraryIcon', order: 4 },
    { name: 'Fitness & Gym', icon: 'GymIcon', order: 5 },
    { name: 'Sports & Games', icon: 'GymIcon', order: 6 },
    { name: 'Security & Safety', icon: 'SecurityIcon', order: 7 },
    { name: 'Utilities & Laundry', icon: 'LaundryIcon', order: 8 }
  ];

  await this.insertMany(defaults);
  console.log('[FacilityCategory] Seeded default categories');
};

module.exports = mongoose.model('FacilityCategory', FacilityCategorySchema);
