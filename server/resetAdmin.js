const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ $or: [{ email: 'madhaku635@gmail' }, { role: 'ADMIN' }] });
    if (!admin) {
      console.log('No admin found.');
      process.exit(1);
    }
    admin.passwordHash = '123123';
    await admin.save({ validateBeforeSave: false });
    console.log('Admin password reset to "123123"');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
