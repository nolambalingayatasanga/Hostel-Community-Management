// Centralized Backend Error Handler Middleware

const errorHandler = (err, req, res, next) => {
  console.error("Error stack:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = [];

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}. An account with this ${field} already exists.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    errors = Object.values(err.errors).map((el) => el.message);
    message = `Invalid input: ${errors.join(", ")}`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found with id of ${err.value}`;
  }

  // Handle JSON Web Token Error
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token. Please log in again.";
  }

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message =
        "File size is too large! Maximum video limit is 99 MB and image limit is 9.8 MB.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message =
        "Too many files uploaded at once. Maximum 10 files allowed per upload.";
    } else {
      message = `Media upload error: ${err.message}`;
    }
  }

  // Handle TokenExpiredError
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired. Please log in again.";
  }

  // express-rate-limit validation should never block login with a 500
  if (err.code && String(err.code).startsWith("ERR_ERL_")) {
    statusCode = 429;
    message = "Too many requests. Please try again in a moment.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
