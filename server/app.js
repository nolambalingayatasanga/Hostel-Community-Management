require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

// Secure backend with Helmet security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allows loading local images if needed
  }),
);

// Setup CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

// Limit request sizes to prevent abuse
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const mongoose = require("mongoose");

// Ensure MongoDB is connected in serverless / production environments
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState < 1) {
    try {
      const mongoUri =
        process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostel-community";
      await mongoose.connect(mongoUri);
    } catch (err) {
      console.error("Database connection error in middleware:", err);
    }
  }
  next();
});

// Trust proxy for Vercel / serverless deployments
app.set("trust proxy", 1);

// Setup rate limiter for authentication endpoints
// validate:false so proxy/IP headers never break login with a 500
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  validate: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Import route files
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const crmRoutes = require("./routes/crmRoutes");
const accessRoutes = require("./routes/accessRoutes");
const driveLinkRoutes = require("./routes/driveLinkRoutes");

// Mount auth/core routes first — login must never depend on QR packages
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/drive-links", driveLinkRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/access", accessRoutes);

// QR routes are optional; a missing dep must not take down login
try {
  const qrScanRoutes = require("./routes/qrScanRoutes");
  app.use("/api/qr-scans", qrScanRoutes);
  const deviceDetector = require("./middleware/deviceMiddleware");
  const loginQrController = require("./controllers/loginQrController");
  app.get("/t/:code", deviceDetector, loginQrController.trackLoginQr);
} catch (err) {
  console.error(
    "QR scan routes failed to load (login still works):",
    err.message,
  );
}

// Health check endpoints
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Backend is running fine" });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Backend is running fine" });
});

// Serve static uploads if using local fallback storage
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Catch-all route not found handler (Express 5 compatible)
app.use((req, res, next) => {
  const error = new Error(`Cannot find ${req.originalUrl} on this server`);
  error.statusCode = 404;
  next(error);
});

// Hook central error middleware
app.use(errorHandler);

module.exports = app;
