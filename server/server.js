const dotenv = require('dotenv');
const path = require('path');
// Load environment variables before running any code
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const { checkAndTransitionStudents } = require('./utils/studentTransition');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, async () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    
    // Run student transition check on server startup
    await checkAndTransitionStudents();
    
    // Set up a daily check (every 24 hours)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    setInterval(async () => {
      await checkAndTransitionStudents();
    }, ONE_DAY_MS);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB. Server not started.', err);
});
